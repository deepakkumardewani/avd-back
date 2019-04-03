const express = require('express')
const router = express.Router()
const axios = require('axios')

const Audio = require('../models/audio')

const config = require('../config')
const upload = require('../helpers/upload')

const AUDIO_URL = 'https://avd-bapuji.sfo2.digitaloceanspaces.com/audios/'
const { youtubeUrl, YOUTUBE_KEY, PLAYLIST_ID } = config
/*
  LECTURES
  */
router.post('/audio/daily', (req, res) => {
  upload(req, res, 'audios', function (error, data) {
    if (error) {
      res.status(409).send('Error Uploading', error)
    }

    const { originalname, location } = data

    // e.g. originalname: '2019.01.01 File name.mp3'
    const title = originalname.substr(0, originalname.indexOf(' ')) // set date as title
    const subTitle = originalname.substr(originalname.indexOf(' ') + 1).split('.')[0] // set name as subtitle and remove '.mp3'

    // DO returns relative path of location of the uploaded file if the file is large
    // Hence, creating a new complete URL for the uploaded file
    // and saving in the DB
    if (!data.location.startsWith('https://')) {
      const fileName = data.originalname.replace(/ /g, '%20')
      data.location = `${AUDIO_URL}${fileName}`
    }

    try {
      const audio = new Audio({
        title,
        subTitle,
        url: data.location
      })
      audio.save().then(() => {
        res.status(200).send('Successfully uploaded files!')
      })
    } catch (error) {
      return res.status(500).send(error)
    }
  })
})

router.get('/audio/daily', async (req, res) => {
  try {
    const audios = await Audio.findOne().sort({title: -1})
    return res.status(200).json(audios)
  } catch (error) {
    return res.status(500).send(error)
  }
})

router.get('/audio', async (req, res) => {
  try {
    const audios = await Audio.find().sort({title: -1})
    return res.status(200).json(audios)
  } catch (error) {
    return res.status(500).send(error)
  }
})

router.post('/video', async (req, res) => {
  try {
    const { token } = req.body
    const videoList = await axios.get(`${youtubeUrl}playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_KEY}&pageToken=${token}`)
    let videos
    const videoIdArray = videoList.data.items.map(video => {
      return video.snippet.resourceId.videoId
    })

    try {
      let videosData = await axios.get(`${youtubeUrl}videos?part=snippet,contentDetails,statistics&key=${YOUTUBE_KEY}&id=${videoIdArray}`)

      videos = videosData.data.items.map(video => {
        return {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.high.url,
          videoUrl: `https://www.youtube.com/embed/${video.id}`,
          viewCount: video.statistics.viewCount,
          duration: video.contentDetails.duration
        }
      })

      return res.status(200).json({
        token: videoList.data.nextPageToken,
        videos,
        totalResults: videoList.data.pageInfo.totalResults
      })
    } catch (error) {
      console.error(error)
    }
  } catch (error) {
    console.error(error)
  }
})

module.exports = router
