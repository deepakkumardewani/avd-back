const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const Album = new Schema({
  'id': String,
  'date': {
    'type': Date,
    'required': [true, 'can\'t be blank'],
    default: Date.now
  },
  'title': {
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
  collection: 'album'
})

const AlbumModel = mongoose.model('album', Album)

module.exports = AlbumModel
