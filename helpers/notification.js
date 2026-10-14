const admin = require('firebase-admin')

const CHUNK_SIZE = 1000

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
  for (const chunk of chunks) {
    const tokens = chunk
      .map(doc => doc.data().token)
      .filter(token => typeof token === 'string' && token.length > 0)
    if (!tokens.length) continue

    try {
      const response = await admin.messaging().sendToDevice(tokens, payload)
      results.push(response)
    } catch (err) {
      console.error('Failed to send notification chunk', err)
    }
  }

  return results
}

module.exports = sendNotification
