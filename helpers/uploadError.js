function errorMessage (error) {
  if (!error) return 'Unknown error'
  if (typeof error === 'string') return error
  return error.message || 'Unknown error'
}

function logUploadError (details) {
  const error = details.error
  const entry = {
    route: details.route,
    step: details.step,
    message: errorMessage(error)
  }
  if (details.filename) entry.filename = details.filename
  if (details.folder) entry.folder = details.folder
  if (details.title) entry.title = details.title
  if (details.album) entry.album = details.album
  if (error && (error.code || error.statusCode || error.status)) {
    entry.code = error.code || error.statusCode || error.status
  }
  if (error && error.stack) entry.stack = error.stack
  console.error('[upload]', entry)
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
