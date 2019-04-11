const express = require('express')
const router = express.Router()
const AWS = require('aws-sdk')
const upload = require('../helpers/upload')
const config = require('../config')

const Darshan = require('../models/darshan')
const Album = require('../models/album')
/*
  DARSHAN
  */
router.post('/dailyDarshan', (req, res) => {
  upload(req, res, 'daily-darshan', function (err, data) {
    if (err) {
      console.error('error')
      res.send('Error')
    }
    const date = new Date()
    const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
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
    }, (err, doc) => {
      if (err) {
        console.log('Something wrong when updating data!')
      }
      res.status(200).send('Successfully uploaded files!')
    })
  })
})

router.get('/dailyDarshan', async (req, res) => {
  try {
    const date = new Date()
    const dateFormat = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
    const dailyDarshan = await Darshan.findOne({
      date: dateFormat
    }) // get darshan for today date only
    return res.status(200).json(dailyDarshan)
  } catch (error) {
    return res.status(500).send(error)
  }
})

router.delete('/dailyDarshan', async (req, res) => {
  const spacesEndpoint = new AWS.Endpoint(`${config.spacesEndpoint}/events`)

  const params = {  Bucket: 'avd-bapuji', Key: 'bapuji.jpg' };

  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: '5D43XLAGUY6OKJB7NWNM',
    secretAccessKey: 'k5jpTC6bCzK7XjWXl52S9iY7cATvKD+BTkgKWHHStfg'
  })
  s3.deleteObject(params, function (err, data) {
    if (err) console.log(err, err.stack); // error
    else console.log(data); // deleted
  });
  // var deleteItems = []
  // const images = await Darshan.find({})

  // // console.log(images)

  // // res.status(200).json({message: 'delete success'})
  // images.forEach(function (item) {
  //   deleteItems.push({Key: `/daily-darshan/${item.fileName}`})
  // })

  // var params = {
  //   Bucket: 'avd-bapuji',
  //   Delete: {
  //     Objects: deleteItems,
  //     Quiet: false
  //   }
  // }

  // const spacesEndpoint = new AWS.Endpoint(`sfo2.digitaloceanspaces.com/daily-darshan`)
  // const s3 = new AWS.S3({
  //   endpoint: spacesEndpoint,
  //   accessKeyId: '5D43XLAGUY6OKJB7NWNM',
  //   secretAccessKey: 'k5jpTC6bCzK7XjWXl52S9iY7cATvKD+BTkgKWHHStfg'
  // })
  // s3.deleteObjects(params, function (err, data) {
  //   if (err) console.log(err)
  //   else console.log('Successfully deleted myBucket/myKey')
  // })

  // res.json({
  //   message: 'images deleted',
  //   items: deleteItems
  // })

  // Darshan.deleteOne({}, function (err) {
  //   if (err) {
  //     return res.err('err deleting', err)
  //   }
  //   res.status(200).json({
  //     message: 'delete success'
  //   })
  // })
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