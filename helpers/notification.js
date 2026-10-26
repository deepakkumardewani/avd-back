const admin = require('firebase-admin')
const logger = require('./logger')

const CHUNK_SIZE = 500

const sendNotification = async (title, body, data) => {
  const payload = {
    data,
    notification: {
      title,
      body
    }
  }

  const devices = await admin.firestore().collection('devices').get()
  const docs = devices.docs.slice()
  const chunks = []

  while (docs.length > 0) {
    chunks.push(docs.splice(0, CHUNK_SIZE))
  }

  const results = []
  let failureCount = 0

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index]
    const tokens = chunk
      .map(doc => doc.data().token)
      .filter(token => typeof token === 'string' && token.length > 0)
    if (!tokens.length) continue

    try {
      const response = await admin.messaging().sendToDevice(tokens, payload)
      results.push(response)
      const failed = response.failureCount || 0
      if (failed > 0) {
        failureCount += failed
        logger.warn('push chunk partial failure', {
          chunk: index + 1,
          tokenCount: tokens.length,
          failureCount: failed
        })
      }
    } catch (err) {
      failureCount += tokens.length
      logger.error('push chunk failed', {
        chunk: index + 1,
        tokenCount: tokens.length,
        error: logger.serializeError(err)
      })
    }
  }

  if (failureCount > 0) {
    logger.warn('push completed with failures', {
      chunkCount: chunks.length,
      failureCount
    })
  }

  return results
}

module.exports = sendNotification
