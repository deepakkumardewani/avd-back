const { parseDatePrefix } = require('./parseDailyAudioFilename')

const TITLE_MIN = 5
const TITLE_MAX = 100
const UPLOAD_DATE_MIN = '2015-01-01'

function validationError (message) {
  const error = new Error(message)
  error.status = 400
  return error
}

function formatTodayIso () {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Validates multipart `date` and `subTitle` for daily audio upload.
 * @returns {{ year, month, day, date, title, subTitle }} title is normalized YYYY-MM-DD
 */
function parseDailyAudioForm (dateStr, subTitleStr) {
  if (dateStr == null || String(dateStr).trim() === '') {
    throw validationError('Date is required')
  }

  const parsedDate = parseDatePrefix(String(dateStr).trim())
  if (!parsedDate) {
    throw validationError('Invalid date')
  }

  if (subTitleStr == null || String(subTitleStr).trim() === '') {
    throw validationError('Title is required')
  }

  const rawTitle = String(subTitleStr)
  if (/[\r\n\t]/.test(rawTitle)) {
    throw validationError('Title cannot contain line breaks')
  }

  const subTitle = rawTitle.trim()
  if (subTitle.length < TITLE_MIN) {
    throw validationError(`Title must be at least ${TITLE_MIN} characters`)
  }
  if (subTitle.length > TITLE_MAX) {
    throw validationError(`Title must be at most ${TITLE_MAX} characters`)
  }

  const title = `${parsedDate.year}-${parsedDate.month}-${parsedDate.day}`
  if (title < UPLOAD_DATE_MIN) {
    throw validationError('Date is too far in the past')
  }
  if (title > formatTodayIso()) {
    throw validationError('Date cannot be in the future')
  }

  return {
    ...parsedDate,
    title,
    subTitle
  }
}

module.exports = parseDailyAudioForm
