const express = require('express')
const router = express.Router()
const AWS = require('aws-sdk')
const upload = require('../helpers/upload')
const config = require('../config')

const sendNotification = require('../helpers/notification')
const Darshan = require('../models/darshan')
const Album = require('../models/album')
/*
  DARSHAN
  */
router.post('/dailyDarshan', (req, res) => {
  const date = new Date()
  const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  upload(req, res, `daily-darshan/${dateFormat}`, function (err, data) {
    if (err) {
      console.error('error')
      res.send('Error')
    }

    Darshan.findOneAndUpdate({
      date: dateFormat
    }, {
      $push: {
        imageUrls: data.location
      },
      $set: {
        date: dateFormat
      }
    }, {
      upsert: true,
      new: true
    }, async (err, doc) => {
      if (err) {
        console.error('Something wrong when updating data!', err)
        return res.status(500).send(err)
      }
      const data = {
        page: '/tabs/tab2'
      }
      await sendNotification('Hare Krishna', `Daily darshan is now available`, data)
      return res.status(200).json({
        msg: 'Successfully uploaded files!',
        data: doc
      })
    })
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
      date: -1
    })
    return res.status(200).json(dailyDarshan)
  } catch (error) {
    return res.status(500).send(error)
  }
})

router.delete('/dailyDarshan', async (req, res) => {
  let count = 0
  const date = new Date()
  let dailyDarshan
  const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  try {
    dailyDarshan = await Darshan.findOne({
      date: dateFormat
    }) // get darshan for today date only
  } catch (error) {
    console.error(error)
  }

  const spacesEndpoint = new AWS.Endpoint(`${config.spacesEndpoint}/daily-darshan`)

  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: '5D43XLAGUY6OKJB7NWNM',
    secretAccessKey: 'k5jpTC6bCzK7XjWXl52S9iY7cATvKD+BTkgKWHHStfg'
  })

  if (dailyDarshan && dailyDarshan.imageUrls) {
    dailyDarshan.imageUrls.forEach(url => {
      const key = url.substr(url.lastIndexOf('/') + 1)
      const params = {
        Bucket: 'avd-bapuji',
        Key: key
      }
      s3.deleteObject(params, function (err, data) {
        if (err) {
          console.log(err, err.stack)
        } else {
          count++
          if (count === dailyDarshan.imageUrls.length) {
            Darshan.deleteOne({date: dateFormat}, function (err) {
              if (err) {
                return res.err('err deleting', err)
              }
              res.status(200).json({
                message: 'all images deleted'
              })
            })
          }
        } // deleted
      })
    })
  }
  return res.err('err', dailyDarshan)
})

/*
  ALBUMS
  */
router.post('/album', async (req, res) => {
  let {
    albumtitle
  } = req.headers
  albumtitle = albumtitle.split(/[ ,]+/).join('_')

  upload(req, res, `albums/${albumtitle}`, function (err, data) {
    if (err) {
      console.error('error')
      res.send(err)
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
  const albumId = albumTitle.split(/[ ,]+/).join('_')

  Album.findOneAndUpdate({
    id: albumId
  }, {
    $addToSet: {
      imageUrls: {
        $each: imageUrls
      },
      videoUrls: {
        $each: videoUrls
      }
    },
    $set: {
      title: albumTitle
    }
  }, {
    upsert: true
  }, function (err) {
    if (err) {
      console.log(err)
    } else {
      console.log('Successfully added')
    }
  })
  return res.status(200).json({
    msg: 'Successfully added'
  })
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
