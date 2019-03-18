const express = require('express')
const router = express.Router()

const Event = require('../models/event')

const upload = require('../helpers/upload')

/*
EVENTS
*/
router.post('/', (req, res) => {
  upload(req, res, 'events', function (err, data) {
    if (err) {
      console.error('error')
      res.send(err)
    }

    const { type, date, title, description, location } = req.body
    try {
      const event = new Event({
        type: type,
        date: date,
        title: title,
        description: description,
        bannerUrl: location
      })
      event.save().then((result) => {
        return res.status(200).json(result)
      })
    } catch (error) {
      return res.status(500).send(error)
    }
  })
})

router.put('/', (req, res) => {
  upload(req, res, 'events', function (err, data) {
    if (err) {
      console.error('error')
      res.send(err)
    }

    // TO-DO: push image / video urls in the DB
  })
})

router.get('/', async (req, res) => {
  const { limit } = req.query
  try {
    if (limit) {
      const events = await Event.find().sort({date: 'ascending'}).limit(parseInt(limit))
      return res.status(200).json(events)
    }

    const events = await Event.find().sort({date: 'ascending'})
    return res.status(200).json(events)
  } catch (error) {
    return res.status(500).send(error)
  }
})

module.exports = router
