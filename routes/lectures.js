const express = require('express')
const path = require('path')
const router = express.Router()
const axios = require('axios')

const Audio = require('../models/audio')

// const config = require('/Users/Shared/Relocated\ Items/Security/secrets/avd/config')
// const config = require('/secrets/avd/config')
const upload = require('../helpers/upload')
const parseDailyAudioForm = require('../helpers/parseDailyAudioForm')
const { logUploadError, sendUploadError } = require('../helpers/uploadError')

const DAILY_AUDIO_VALIDATION_MESSAGES = new Set([
  'Date is required',
  'Invalid date',
  'Date is too far in the past',
  'Date cannot be in the future',
  'Title is required',
  'Title cannot contain line breaks',
  'Title must be at least 5 characters',
  'Title must be at most 100 characters'
])

function isValidationError (error) {
  return error.status === 400 && DAILY_AUDIO_VALIDATION_MESSAGES.has(error.message)
}

function buildCanonicalBasename (parsed, originalname) {
  const ext = path.extname(originalname || '')
  return `${parsed.title} ${parsed.subTitle}${ext}`.replace(/[/\\]/g, '').trim()
}

const sendNotification = require('../helpers/notification')

// const AUDIO_URL = 'https://avd-bapuji.sfo2.cdn.digitaloceanspaces.com/audios/'
const {
  youtubeUrl,
  youtubeEmbedUrl,
  YOUTUBE_KEY,
  PLAYLIST_ID,
  bucketName,
  spacesEndpoint
} = global.config

const AUDIO_URL = `https://${bucketName}.${spacesEndpoint}/audios/`

/*
  LECTURES
  */
router.post('/audio/daily', (req, res) => {
  upload(req, res, function (request, file) {
    const parsed = parseDailyAudioForm(request.body.date, request.body.subTitle)
    request.dailyAudio = parsed
    const canonicalBasename = buildCanonicalBasename(parsed, file.originalname)
    return `audios/${parsed.year}/${parsed.month}/${canonicalBasename}`
  }, async function (error, result) {
    if (error) {
      const validationFailed = isValidationError(error)
      const isNoFile = error.message === 'No file uploaded'
      const step = validationFailed ? 'validate' : 'storage'
      const status = validationFailed || isNoFile ? 400 : 500
      const filename = error.filename || (req.file && req.file.originalname)
      logUploadError({
        route: 'POST /lectures/audio/daily',
        step,
        filename,
        error
      })
      const displayMsg = validationFailed
        ? error.message
        : isNoFile
          ? 'No file was uploaded. Choose an audio file and try again.'
          : 'Could not upload the satsang audio.'
      return sendUploadError(res, status, displayMsg, validationFailed ? error.message : error)
    }

    const parsed = req.dailyAudio
    if (!parsed) {
      const missingFieldsError = new Error('Date is required')
      missingFieldsError.status = 400
      logUploadError({
        route: 'POST /lectures/audio/daily',
        step: 'validate',
        filename: result && result.originalname,
        error: missingFieldsError
      })
      return sendUploadError(res, 400, missingFieldsError.message, missingFieldsError.message)
    }

    // DO returns a relative path when the file is large.
    if (!result.location || !result.location.startsWith('https://')) {
      const uploadedBasename = result.key
        ? path.basename(result.key)
        : buildCanonicalBasename(parsed, result.originalname)
      const fileName = uploadedBasename.replace(/ /g, '%20')
      result.location = `${AUDIO_URL}${parsed.year}/${parsed.month}/${fileName}`
    }

    try {
      const audio = new Audio({
        title: parsed.title,
        subTitle: parsed.subTitle,
        date: parsed.date,
        url: result.location,
        fileTitle: `${parsed.title} ${parsed.subTitle}`.replace(/-|\s/g, '_')
      })
      const doc = await audio.save()

      const data = {
        page: '/tabs/tab1'
      }

      let notifMsg = `Today's audio satsang is now available`
      if (parsed.subTitle.substring(0, 2) === 'BM') {
        notifMsg = `Today's Brhama Muhrat audio satsang is now available`
      }
      try {
        await sendNotification('Hare Krishna', notifMsg, data)
      } catch (notifyError) {
        logUploadError({
          route: 'POST /lectures/audio/daily',
          step: 'notification',
          filename: path.basename(result.originalname),
          error: notifyError
        })
      }
      return res.status(200).json({
        msg: 'Successfully uploaded file!',
        data: doc
      })
    } catch (saveError) {
      logUploadError({
        route: 'POST /lectures/audio/daily',
        step: 'database',
        filename: path.basename(result.originalname),
        title: parsed.title,
        error: saveError
      })
      return sendUploadError(res, 500, 'The audio uploaded, but saving it failed.', saveError)
    }
  })
})

router.get('/audio/daily', async (_, res) => {
  try {
    // const audios = await Audio.findOne().sort({
    //   title: -1
    // })
    const audio = await Audio.find().sort({createdAt: -1}).limit(1)
    return res.status(200).json(audio[0] || null)
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
      page,
      search
    } = req.query

    if (!limit) {
      limit = 30
    }
    if (!page) {
      page = 1
    }
    limit = parseInt(limit)
    page = parseInt(page)

    const query = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subTitle: { $regex: search, $options: 'i' } }
      ]
    }

    const audios = await Audio.paginate(query, {
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
