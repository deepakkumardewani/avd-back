const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const Schema = mongoose.Schema

const Darshan = new Schema({
  'id': Schema.ObjectId,
  'type': {
    'type': String,
    default: 'daily-darshan'
  },
  fileName: String,
  'date': {
    'type': Date,
    'required': [true, 'can\'t be blank'],
    default: Date.now
  },
  imageUrls: [String]
}, {
  versionKey: false,
  timestamps: true,
  collection: 'darshan'
})

const DarshanModel = mongoose.model('darshan', Darshan)

module.exports = DarshanModel
