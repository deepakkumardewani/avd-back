const LEVELS = new Set(['debug', 'info', 'warn', 'error'])

function serializeError (error) {
  if (!error) return undefined
  if (typeof error === 'string') return { message: error }
  return {
    name: error.name,
    message: error.message,
    code: error.code || error.statusCode || error.status,
    stack: error.stack
  }
}

/**
 * One JSON object per line for pm2 / log aggregators.
 */
function log (level, message, meta) {
  if (!LEVELS.has(level)) level = 'info'
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message
  }
  if (meta && typeof meta === 'object') {
    Object.keys(meta).forEach((key) => {
      if (meta[key] !== undefined) entry[key] = meta[key]
    })
  }
  const line = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') {
    console.error(line)
  } else {
    console.log(line)
  }
}

module.exports = {
  log,
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  serializeError
}
