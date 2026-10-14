const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')

function uploadFile (req, res, folderPath, cb) {
  const resolveKey = typeof folderPath === 'function' ? folderPath : null
  const endpointHost = resolveKey
    ? global.config.spacesEndpoint
    : `${global.config.spacesEndpoint}/${folderPath}`
  const spacesEndpoint = new AWS.Endpoint(endpointHost)
  const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: global.config.spaces.accessKey,
    secretAccessKey: global.config.spaces.secretAccess
  })

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: 'avd-bapuji',
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, done) {
        if (!resolveKey) {
          done(null, file.originalname)
          return
        }
        try {
          const key = resolveKey(req, file)
          if (!key) {
            done(new Error('Could not build upload path'))
            return
          }
          done(null, key)
        } catch (err) {
          done(err)
        }
      }
    })
  }).single('upload')

  upload(req, res, function (error) {
    if (error) {
      console.error(error)
      cb(error)
      return
    }
    if (!req.file) {
      cb(new Error('No file uploaded'))
      return
    }
    cb(null, req.file)
  })
}

module.exports = uploadFile
