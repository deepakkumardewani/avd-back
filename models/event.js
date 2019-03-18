const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const Event = new Schema({
  'id': Schema.ObjectId,
  'type': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'date': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'title': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'description': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'shortDesc': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'bannerUrl': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'imageUrls': {
    'type': [String],
    'required': [true, 'can\'t be blank'],
    default: []
  },
  'videoUrls': {
    'type': [String],
    'required': [true, 'can\'t be blank'],
    default: []
  }
}, {
  versionKey: false,
  timestamps: true,
  collection: 'event'
})

const EventModel = mongoose.model('event', Event)

module.exports = EventModel
