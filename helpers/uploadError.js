const logger = require('./logger')

function errorMessage (error) {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  return error.message || 'Unknown error'
}

function logUploadError (details) {
  const error = details.error
  logger.error('upload failed', {
    route: details.route,
    step: details.step,
    message: errorMessage(error),
    filename: details.filename,
    folder: details.folder,
    title: details.title,
    album: details.album,
    error: logger.serializeError(error)
  })
}

function sendUploadError (res, status, msg, error) {
  return res.status(status).json({
    msg: msg,
    error: errorMessage(error)
  })
}

module.exports = {
  errorMessage,
  logUploadError,
  sendUploadError
}
