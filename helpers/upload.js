const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const config = require('../config')

function uploadFile (req, res, folderPath, cb) {
  // Configure client for use with Spaces
  const spacesEndpoint = new AWS.Endpoint(`${config.spacesEndpoint}/${folderPath}`)
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: config.spaces.accessKey,
    secretAccessKey: config.spaces.secretAccess
  })

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: 'avd-bapuji',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        cb(null, file.originalname)
      }
    })
  }).single('upload')

  upload(req, res, function (error) {
    if (error) {
      console.error(error)
      cb(error, null)
    }
    cb(null, req.file)
  })
}

module.exports = uploadFile
