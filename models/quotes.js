const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const Quote = new Schema({
  'id': Schema.ObjectId,
  'date': {
    'type': Date,
    'required': [true, 'can\'t be blank'],
    default: Date.now
  },
  'url': {
    type: String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'text': {
    type: String,
    'required': [true, 'can\'t be blank'],
    default: ''
  }
}, {
  versionKey: false,
  timestamps: true,
  collection: 'quote'
})

const QuoteModel = mongoose.model('quote', Quote)

module.exports = QuoteModel
