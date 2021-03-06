const express = require('express')
const router = express.Router()
const axios = require('axios')

const Audio = require('../models/audio')

const config = require('/secrets/avd/config')
const upload = require('../helpers/upload')

const sendNotification = require('../helpers/notification')

const AUDIO_URL = 'https://avd-bapuji.sfo2.digitaloceanspaces.com/audios/'
const {
  youtubeUrl,
  youtubeEmbedUrl,
  YOUTUBE_KEY,
  PLAYLIST_ID
} = config
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
      await sendNotification('Hare Krishna', `Today's audio satsang is now available`, data)
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

router.get('/audio/daily', async (req, res) => {
  try {
    const audios = await Audio.findOne().sort({
      title: -1
    })
    return res.status(200).json(audios)
  } catch (error) {
    return res.status(409).json({
      msg: 'Something wrong!',
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
          thumbnail: thumbnails.high.url,
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
