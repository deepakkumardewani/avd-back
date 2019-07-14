const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const Audio = new Schema({
  'id': Schema.ObjectId,
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
  'subTitle': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'url': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  },
  'fileTitle': {
    'type': String,
    'required': [true, 'can\'t be blank'],
    default: ''
  }
}, {
  versionKey: false,
  timestamps: true,
  collection: 'audio'
})

Audio.plugin(mongoosePaginate)

const AudioModel = mongoose.model('audio', Audio)

module.exports = AudioModel
