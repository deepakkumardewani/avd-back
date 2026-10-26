const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'wav', 'aac', 'ogg']

function isRealUtcDate (year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
}

function parseDatePrefix (datePart) {
  const yearFirst = datePart.match(/^(\d{4})[.-](\d{2})[.-](\d{2})$/)
  const dayFirst = datePart.match(/^(\d{2})[.-](\d{2})[.-](\d{4})$/)

  let year
  let month
  let day
  if (yearFirst) {
    year = Number(yearFirst[1])
    month = Number(yearFirst[2])
    day = Number(yearFirst[3])
  } else if (dayFirst) {
    day = Number(dayFirst[1])
    month = Number(dayFirst[2])
    year = Number(dayFirst[3])
  } else {
    return null
  }

  if (!isRealUtcDate(year, month, day)) return null

  return {
    year: String(year),
    month: String(month).padStart(2, '0'),
    day: String(day).padStart(2, '0'),
    date: new Date(Date.UTC(year, month - 1, day))
  }
}

function stripAudioExtension (name) {
  const match = name.match(/\.([a-z0-9]+)$/i)
  if (!match || !AUDIO_EXTENSIONS.includes(match[1].toLowerCase())) return name
  return name.slice(0, -match[0].length).trim()
}

/**
 * Daily satsang files look like:
 *   2019.12.01 File name.mp3
 *   2019-12-01 File name.mp3
 * A day-first prefix (01.12.2019 / 01-12-2019) is also accepted.
 * The title keeps the original date text. The subtitle keeps dots in the name.
 */
function parseDailyAudioFilename (originalname) {
  if (!originalname || typeof originalname !== 'string') return null

  const trimmed = originalname.trim()
  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex === -1) return null

  const datePart = trimmed.slice(0, spaceIndex)
  const subTitle = stripAudioExtension(trimmed.slice(spaceIndex + 1).trim())
  const parsedDate = parseDatePrefix(datePart)
  if (!parsedDate || !subTitle) return null

  return {
    ...parsedDate,
    title: datePart,
    subTitle
  }
}

module.exports = parseDailyAudioFilename
module.exports.parseDatePrefix = parseDatePrefix
module.exports.isRealUtcDate = isRealUtcDate
