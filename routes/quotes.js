const express = require('express')
const router = express.Router()

const Quote = require('../models/quotes')

const upload = require('../helpers/upload')

/*
  QUOTES
  */
router.post('/', (req, res) => {
  upload(req, res, 'quotes', function (err, data) {
    if (err) {
      console.error('error')
      res.send(err)
    }

    try {
      const quote = new Quote({
        url: data.location,
        text: req.body.text
      })
      quote.save().then(() => {
        return res.status(200).send('Successfully uploaded files!')
      })
    } catch (error) {
      return res.status(500).send(error)
    }
  })
})

router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find()
    return res.status(200).json(quotes)
  } catch (error) {
    return res.status(500).send(error)
  }
})

module.exports = router
