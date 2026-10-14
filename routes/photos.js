const express = require('express')
const router = express.Router()
const AWS = require('aws-sdk')
const upload = require('../helpers/upload')
const compress = require('../helpers/compress')
const { logUploadError, sendUploadError } = require('../helpers/uploadError')
// const config = require('/secrets/avd/config')
const Darshan = require('../models/darshan')
const Album = require('../models/album')
/*
  DARSHAN
  */
function toCdnUrl (location) {
  if (typeof location !== 'string') return location
  if (location.includes('sfo2.cdn')) return location
  return location.replace('sfo2.', 'sfo2.cdn.')
}

router.post('/dailyDarshan', (req, res) => {
  const date = new Date()
  const year = date.getFullYear()
  const month = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1)
  const day = (date.getDate() < 10 ? '0' : '') + date.getDate()
  const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  upload(req, res, `daily-darshan/${year}/${month}/${day}`, async function (err, data) {
    if (err) {
      const isNoFile = err.message === 'No file uploaded'
      logUploadError({
        route: 'POST /photos/dailyDarshan',
        step: 'storage',
        filename: req.file && req.file.originalname,
        folder: `${year}/${month}/${day}`,
        error: err
      })
      return sendUploadError(
        res,
        isNoFile ? 400 : 500,
        isNoFile
          ? 'No file was uploaded. Choose a photo and try again.'
          : 'Could not upload the darshan photo.',
        err
      )
    }

    let compressedImage
    try {
      compressedImage = await compress(data.location, `${year}/${month}/${day}`)
      if (!compressedImage || !compressedImage.location) {
        throw new Error('Compressed image has no location')
      }
    } catch (error) {
      logUploadError({
        route: 'POST /photos/dailyDarshan',
        step: 'compress',
        filename: data.originalname || data.key,
        folder: `${year}/${month}/${day}`,
        error
      })
      return sendUploadError(res, 500, 'The photo uploaded, but creating the thumbnail failed.', error)
    }

    try {
      const doc = await Darshan.findOneAndUpdate({
        date: dateFormat
      }, {
        $push: {
          imageUrls: {
            url: toCdnUrl(data.location),
            placeholder: compressedImage.location
          }
        },
        $set: {
          date: dateFormat
        }
      }, {
        upsert: true,
        new: true
      })

      return res.status(200).json({
        msg: 'Successfully uploaded file!',
        data: doc
      })
    } catch (error) {
      logUploadError({
        route: 'POST /photos/dailyDarshan',
        step: 'database',
        filename: data.originalname || data.key,
        folder: `${year}/${month}/${day}`,
        error
      })
      return sendUploadError(res, 500, 'The photo uploaded, but saving it failed.', error)
    }
  })
})

router.get('/dailyDarshan', async (req, res) => {
  try {
    // const date = new Date()
    // const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    // const dailyDarshan = await Darshan.findOne({
    //   date: dateFormat
    // }) // get darshan for today date only
    const dailyDarshan = await Darshan.findOne({}).sort({
      createdAt: -1
    })
    return res.status(200).json(dailyDarshan)
  } catch (error) {
    return res.status(500).send(error)
  }
})

router.delete('/dailyDarshan', async (req, res) => {
  Darshan.remove({ _id: req.query.id }, async (err, doc) => {
    if (err) {
      return res.status(500).json({
        msg: 'Something wrong!',
        err
      })
    }
    return res.status(200).json(doc)
  })
})

// router.delete('/dailyDarshan', async (req, res) => {
//   let count = 0
//   const date = new Date()
//   let dailyDarshan
//   const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
//   try {
//     dailyDarshan = await Darshan.findOne({
//       date: dateFormat
//     }) // get darshan for today date only
//   } catch (error) {
//     console.error(error)
//   }

//   const spacesEndpoint = new AWS.Endpoint(`${global.config.spacesEndpoint}/daily-darshan`)

//   const s3 = new AWS.S3({
//     endpoint: spacesEndpoint,
//     accessKeyId: '5D43XLAGUY6OKJB7NWNM',
//     secretAccessKey: 'k5jpTC6bCzK7XjWXl52S9iY7cATvKD+BTkgKWHHStfg'
//   })

//   if (dailyDarshan && dailyDarshan.imageUrls) {
//     dailyDarshan.imageUrls.forEach(url => {
//       const key = url.substr(url.lastIndexOf('/') + 1)
//       const params = {
//         Bucket: 'avd-bapuji',
//         Key: key
//       }
//       s3.deleteObject(params, function (err, data) {
//         if (err) {
//           console.log(err, err.stack)
//         } else {
//           count++
//           if (count === dailyDarshan.imageUrls.length) {
//             Darshan.deleteOne({date: dateFormat}, function (err) {
//               if (err) {
//                 return res.err('err deleting', err)
//               }
//               res.status(200).json({
//                 message: 'all images deleted'
//               })
//             })
//           }
//         } // deleted
//       })
//     })
//   }
//   return res.err('err', dailyDarshan)
// })

/*
  ALBUMS
  */
router.post('/album', async (req, res) => {
  let {
    albumtitle
  } = req.headers
  if (!albumtitle) {
    logUploadError({
      route: 'POST /photos/album',
      step: 'validate',
      error: new Error('albumtitle header is required')
    })
    return sendUploadError(res, 400, 'albumtitle header is required', 'albumtitle header is required')
  }
  albumtitle = albumtitle.split(/[ ,]+/).join('_')

  upload(req, res, `albums/${albumtitle}`, function (err, data) {
    if (err) {
      const isNoFile = err.message === 'No file uploaded'
      logUploadError({
        route: 'POST /photos/album',
        step: 'storage',
        filename: req.file && req.file.originalname,
        album: albumtitle,
        error: err
      })
      return sendUploadError(
        res,
        isNoFile ? 400 : 500,
        isNoFile
          ? 'No file was uploaded. Choose a photo and try again.'
          : 'Could not upload the album photo.',
        err
      )
    }
    return res.status(200).json(data)
  })
})

router.post('/save/album', async (req, res) => {
  const {
    albumTitle,
    imageUrls,
    videoUrls
  } = req.body
  if (!albumTitle) {
    return res.status(400).json({
      msg: 'albumTitle is required'
    })
  }
  const albumId = albumTitle.split(/[ ,]+/).join('_')

  try {
    await Album.findOneAndUpdate({
      id: albumId
    }, {
      $addToSet: {
        imageUrls: {
          $each: imageUrls || []
        },
        videoUrls: {
          $each: videoUrls || []
        }
      },
      $set: {
        title: albumTitle
      }
    }, {
      upsert: true
    })
    return res.status(200).json({
      msg: 'Successfully added'
    })
  } catch (err) {
    console.error('album save failed', err)
    return res.status(500).json({
      msg: 'Something went wrong!'
    })
  }
})

router.get('/albums', async (req, res) => {
  try {
    const albums = await Album.find()
    return res.status(200).json(albums)
  } catch (error) {
    return res.status(500).send(error)
  }
})

module.exports = router
