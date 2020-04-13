const express = require('express')
const router = express.Router()
const axios = require('axios')

const Audio = require('../models/audio')

// const config = require('/Users/Shared/Relocated\ Items/Security/secrets/avd/config')
// const config = require('/secrets/avd/config')
const upload = require('../helpers/upload')

const sendNotification = require('../helpers/notification')

const AUDIO_URL = 'https://avd-bapuji.sfo2.digitaloceanspaces.com/audios/'
const {
  youtubeUrl,
  youtubeEmbedUrl,
  YOUTUBE_KEY,
  PLAYLIST_ID
} = global.config
/*
  LECTURES
  */
router.post('/audio/daily', (req, res) => {
  let {
    audiotitle
  } = req.headers

  const [ date, month, year ] = audiotitle.split('.')
  upload(req, res, `audios/${year}/${month}`, async function (error, result) {
    if (error) {
      return res.status(409).json({
        msg: 'Error Uploading',
        error
      })
    }
    const {
      originalname
    } = result

    // e.g. originalname: '2019.01.01 File name.mp3'
    const title = originalname.substr(0, originalname.indexOf(' ')) // set date as title
    const subTitle = originalname.substr(originalname.indexOf(' ') + 1).split('.')[0] // set name as subtitle and remove '.mp3'

    // DO returns relative path of location of the uploaded file if the file is large
    // Hence, creating a new complete URL for the uploaded file
    // and saving in the DB
    if (!result.location.startsWith('https://')) {
      const fileName = result.originalname.replace(/ /g, '%20')
      result.location = `${AUDIO_URL}${year}/${month}/${fileName}`
    }
    try {
      const audio = new Audio({
        title,
        subTitle,
        url: result.location,
        fileTitle: `${title} ${subTitle}`.replace(/-|\s/g, '_')
      })
      const doc = await audio.save()

      const data = {
        page: '/tabs/tab1'
      }

      let notifMsg = `Today's audio satsang is now available`
      if (subTitle.substring(0, 2) === 'BM') {
        notifMsg = `Today's Brhama Muhrat audio satsang is now available`
      }
      sendNotification('Hare Krishna', notifMsg, data)
      // sendNotification('Hare Krishna', `Today's audio satsang is now available`, data)
      return res.status(200).json({
        msg: 'Successfully uploaded file!',
        data: doc
      })
    } catch (error) {
      return res.status(500).json({
        msg: 'Something went wrong!',
        error
      })
    }
  })
})

router.get('/audio/daily', async (_, res) => {
  try {
    // const audios = await Audio.findOne().sort({
    //   title: -1
    // })
    const audio = await Audio.find().sort({createdAt: -1}).limit(1)
    return res.status(200).json(audio[0])
  } catch (error) {
    return res.status(409).json({
      msg: 'Something went wrong!',
      error
    })
    // return res.status(500).send(error)
  }
})

router.get('/audio', async (req, res) => {
  try {
    let {
      limit,
      page
    } = req.query

    if (!limit) {
      limit = 30
    }
    if (!page) {
      page = 1
    }
    limit = parseInt(limit)
    page = parseInt(page)
    const audios = await Audio.paginate({}, {
      page,
      limit,
      sort: {
        updatedAt: -1
      }
    })
    return res.status(200).json(audios)
  } catch (error) {
    return res.status(500).json({
      msg: 'Something wrong!',
      error
    })
  }
})

router.delete('/audio', async (req, res) => {
  Audio.remove({ _id: req.query.id }, async (err, doc) => {
    if (err) {
      return res.status(500).json({
        msg: 'Something wrong!',
        err
      })
    }
    return res.status(200).json(doc)
  })
})

router.get('/video/daily', async (_, res) => {
  try {
    const url = `${youtubeUrl}playlistItems?part=snippet,contentDetails&maxResults=1&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_KEY}`
    const videoList = await axios.get(url)
    const videoId = videoList.data.items && videoList.data.items[0] && videoList.data.items[0].snippet.resourceId.videoId

    try {
      let videosData = await axios.get(`${youtubeUrl}videos?part=snippet,contentDetails,statistics&key=${YOUTUBE_KEY}&id=${videoId}`)

      const videos = videosData.data.items.map(video => {
        const { id, snippet, statistics, contentDetails } = video
        const { title, description, thumbnails, publishedAt } = snippet
        return {
          id: id,
          title: title,
          description: description,
          thumbnail: thumbnails.high.url,
          videoUrl: `${youtubeEmbedUrl}${id}`,
          viewCount: statistics.viewCount,
          duration: contentDetails.duration,
          publishedAt
        }
      })

      const video = videos[0]

      return res.status(200).json({
        video
      })
    } catch (error) {
      return res.status(500).json({
        msg: 'Something went wrong!',
        error
      })
    }
  } catch (error) {
    return res.status(500).json({
      msg: 'Something went wrong!',
      error
    })
  }
})

router.post('/video', async (req, res) => {
  try {
    const {
      token
    } = req.body
    const videoList = await axios.get(`${youtubeUrl}playlistItems?part=snippet,contentDetails&maxResults=20&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_KEY}&pageToken=${token}`)
    let videos
    const videoIdArray = videoList.data.items.map(video => {
      return video.snippet.resourceId.videoId
    })

    try {
      let videosData = await axios.get(`${youtubeUrl}videos?part=snippet,contentDetails,statistics&key=${YOUTUBE_KEY}&id=${videoIdArray}`)

      videos = videosData.data.items.map(video => {
        const { id, snippet, statistics, contentDetails } = video
        const { title, description, thumbnails, publishedAt } = snippet
        return {
          id: id,
          title: title,
          description: description,
          thumbnail: thumbnails.medium.url,
          videoUrl: `${youtubeEmbedUrl}${id}`,
          viewCount: statistics.viewCount,
          duration: contentDetails.duration,
          publishedAt
        }
      })

      return res.status(200).json({
        token: videoList.data.nextPageToken,
        videos,
        totalResults: videoList.data.pageInfo.totalResults
      })
    } catch (error) {
      return res.status(500).json({
        msg: 'Something wrong!',
        error
      })
    }
  } catch (error) {
    return res.status(500).json({
      msg: 'Something wrong!',
      error
    })
  }
})

module.exports = router
