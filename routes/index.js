// (function () {
//   'use strict'
// const express = require('express')
// const router = express.Router()
// const axios = require('axios')
// const multer = require('multer')
// const AWS = require('aws-sdk')
// const config = require('../config')

// const upload = require('../helpers/upload')
// const Audio = require('../models/audio')
// const Darshan = require('../models/darshan')
// const Quote = require('../models/quotes')
// const Event = require('../models/event')
// const Album = require('../models/album')

// const AUDIO_URL = 'https://avd-bapuji.sfo2.digitaloceanspaces.com/audios/'

// const { youtubeUrl, YOUTUBE_KEY, PLAYLIST_ID } = config
/*
  DARSHAN
  */
// router.post('/photos/dailyDarshan', (req, res) => {
//   upload(req, res, 'daily-darshan', function (err, data) {
//     if (err) {
//       console.error('error')
//       res.send('Error')
//     }

//     Darshan.findOneAndUpdate({ type: 'daily-darshan' }, { $push: { imageUrls: data.location } }, {upsert: true, new: true}, (err, doc) => {
//       if (err) {
//         console.log('Something wrong when updating data!')
//       }
//       res.status(200).send('Successfully uploaded files!')
//     })
//   })
// })

// router.get('/photos/dailyDarshan', async (req, res) => {
//   try {
//     const dailyDarshan = await Darshan.find()
//     return res.status(200).json(dailyDarshan)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })

// router.delete('/photos/dailyDarshan', async (req, res) => {
//   // var deleteItems = []
//   // const images = await Darshan.find({})

//   // // console.log(images)

//   // // res.status(200).json({message: 'delete success'})
//   // images.forEach(function (item) {
//   //   deleteItems.push({Key: `/daily-darshan/${item.fileName}`})
//   // })

//   // var params = {
//   //   Bucket: 'avd-bapuji',
//   //   Delete: {
//   //     Objects: deleteItems,
//   //     Quiet: false
//   //   }
//   // }

//   // const spacesEndpoint = new AWS.Endpoint(`sfo2.digitaloceanspaces.com/daily-darshan`)
//   // const s3 = new AWS.S3({
//   //   endpoint: spacesEndpoint,
//   //   accessKeyId: '5D43XLAGUY6OKJB7NWNM',
//   //   secretAccessKey: 'k5jpTC6bCzK7XjWXl52S9iY7cATvKD+BTkgKWHHStfg'
//   // })
//   // s3.deleteObjects(params, function (err, data) {
//   //   if (err) console.log(err)
//   //   else console.log('Successfully deleted myBucket/myKey')
//   // })

//   // res.json({
//   //   message: 'images deleted',
//   //   items: deleteItems
//   // })

//   Darshan.deleteOne({}, function (err) {
//     if (err) {
//       return res.err('err deleting', err)
//     }
//     res.status(200).json({message: 'delete success'})
//   })
// })

/*
  ALBUMS
  */
// router.post('/photos/album', async (req, res) => {
//   let { albumtitle } = req.headers
//   albumtitle = albumtitle.split(/[ ,]+/).join('_')

//   upload(req, res, `albums/${albumtitle}`, function (err, data) {
//     if (err) {
//       console.error('error')
//       res.send(err)
//     }
//     return res.status(200).json(data)
//   })
// })

// router.post('/photos/save/album', async (req, res) => {
//   const { albumTitle, imageUrls, videoUrls } = req.body
//   const albumId = albumTitle.split(/[ ,]+/).join('_')

//   Album.findOneAndUpdate(
//     { id: albumId },
//     { $addToSet:
//       {
//         imageUrls: { $each: imageUrls },
//         videoUrls: { $each: videoUrls }
//       },
//     $set:
//       { title: albumTitle }
//     },
//     { upsert: true }, function (err) {
//       if (err) {
//         console.log(err)
//       } else {
//         console.log('Successfully added')
//       }
//     })
//   // console.log(req.body)
//   return res.status(200).json({ msg: 'Successfully added' })
// })

// router.get('/photos/albums', async (req, res) => {
//   try {
//     const albums = await Album.find()
//     return res.status(200).json(albums)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })

/*
  QUOTES
  */
// router.post('/quotes', (req, res) => {
//   upload(req, res, 'quotes', function (err, data) {
//     if (err) {
//       console.error('error')
//       res.send(err)
//     }

//     try {
//       const quote = new Quote({
//         url: data.location,
//         text: req.body.text
//       })
//       quote.save().then(() => {
//         return res.status(200).send('Successfully uploaded files!')
//       })
//     } catch (error) {
//       return res.status(500).send(error)
//     }
//   })
// })

// router.get('/quotes', async (req, res) => {
//   try {
//     const quotes = await Quote.find()
//     return res.status(200).json(quotes)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })

// /*
// LECTURES
// */
// router.post('/lectures/audio/daily', (req, res) => {
//   upload(req, res, 'audios', function (error, data) {
//     if (error) {
//       res.status(409).send('Error Uploading', error)
//     }

//     const { originalname, location } = data

//     // e.g. originalname: '2019.01.01 File name.mp3'
//     const title = originalname.substr(0, originalname.indexOf(' ')) // set date as title
//     const subTitle = originalname.substr(originalname.indexOf(' ') + 1).split('.')[0] // set name as subtitle and remove '.mp3'

//     // DO returns relative path of location of the uploaded file if the file is large
//     // Hence, creating a new complete URL for the uploaded file
//     // and saving in the DB
//     if (!data.location.startsWith('https://')) {
//       const fileName = data.originalname.replace(/ /g, '%20')
//       data.location = `${AUDIO_URL}${fileName}`
//     }

//     try {
//       const audio = new Audio({
//         title,
//         subTitle,
//         url: location
//       })
//       audio.save().then(() => {
//         res.status(200).send('Successfully uploaded files!')
//       })
//     } catch (error) {
//       return res.status(500).send(error)
//     }
//   })
// })

// router.get('/lectures/audio/daily', async (req, res) => {
//   try {
//     const audios = await Audio.findOne().sort({updatedAt: -1})
//     return res.status(200).json(audios)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })

// router.get('/lectures/audio', async (req, res) => {
//   try {
//     const audios = await Audio.find().sort({updatedAt: -1})
//     return res.status(200).json(audios)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })

// router.get('/lectures/video', async (req, res) => {
//   try {
//     const videoList = await axios.get(`${youtubeUrl}playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_KEY}`)

//     const videoIdArray = videoList.data.items.map(video => {
//       return video.snippet.resourceId.videoId
//     })

//     try {
//       let videos = await axios.get(`${youtubeUrl}videos?part=snippet,contentDetails,statistics&key=${YOUTUBE_KEY}&id=${videoIdArray}`)

//       videos = videos.data.items.map(video => {
//         return {
//           title: video.snippet.title,
//           thumbnail: video.snippet.thumbnails.high.url,
//           videoUrl: `https://www.youtube.com/embed/${video.id}`,
//           viewCount: video.statistics.viewCount,
//           duration: video.contentDetails.duration
//         }
//       })

//       return res.status(200).json(videos)
//     } catch (error) {
//       console.error(error)
//     }
//   } catch (error) {
//     console.error(error)
//   }
// })
/*
  EVENTS
  */
// router.post('/events', (req, res) => {
//   upload(req, res, 'events', function (err, data) {
//     if (err) {
//       console.error('error')
//       res.send(err)
//     }

//     const { type, date, title, description, location } = req.body
//     try {
//       const event = new Event({
//         type: type,
//         date: date,
//         title: title,
//         description: description,
//         bannerUrl: location
//       })
//       event.save().then((result) => {
//         return res.status(200).json(result)
//       })
//     } catch (error) {
//       return res.status(500).send(error)
//     }
//   })
// })

// router.put('/events', (req, res) => {
//   upload(req, res, 'events', function (err, data) {
//     if (err) {
//       console.error('error')
//       res.send(err)
//     }

//     // TO-DO: push image / video urls in the DB
//   })
// })

// router.get('/events', async (req, res) => {
//   const { limit } = req.query
//   try {
//     if (limit) {
//       const events = await Event.find().sort({date: 'ascending'}).limit(parseInt(limit))
//       return res.status(200).json(events)
//     }

//     const events = await Event.find().sort({date: 'ascending'})
//     return res.status(200).json(events)
//   } catch (error) {
//     return res.status(500).send(error)
//   }
// })
//   module.exports = router
// })()
