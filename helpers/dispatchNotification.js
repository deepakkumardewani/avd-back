const logger = require('./logger')
const sendNotification = require('./notification')

function pushNotificationsEnabled () {
  const flag = process.env.PUSH_NOTIFICATIONS_ENABLED
  if (flag === '0' || flag === 'false' || flag === 'off') return false
  return true
}

/**
 * Fire-and-forget push so HTTP handlers (e.g. audio upload) are not blocked by FCM.
 */
function dispatchNotification (title, body, data, context = {}) {
  if (!pushNotificationsEnabled()) {
    logger.info('push notifications skipped', { reason: 'disabled', ...context })
    return
  }

  sendNotification(title, body, data)
    .then((results) => {
      logger.info('push notifications finished', {
        ...context,
        chunkCount: Array.isArray(results) ? results.length : 0
      })
    })
    .catch((err) => {
      logger.error('push notifications failed', {
        ...context,
        error: logger.serializeError(err)
      })
    })
}

module.exports = {
  dispatchNotification,
  pushNotificationsEnabled
}
