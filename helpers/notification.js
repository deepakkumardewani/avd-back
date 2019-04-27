const admin = require('firebase-admin')
const serviceAccount = require('/secrets/avd/anand-vrindavan-dham-firebase-adminsdk-8pplz-033f4dec13.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://anand-vrindavan-dham.firebaseio.com'
})

const sendNotification = async (title, body) => {
  const payload = {
    notification: {
      title,
      body,
      icon: 'https://goo.gl/Fz9nrQ'
    }
  }

  // ref to the device collection for the user
  const db = admin.firestore()
  const devicesRef = db.collection('devices')

  // get the user's tokens and send notifications
  const devices = await devicesRef.get()
  const tokens = []

  // send a notification to each device token
  devices.forEach(result => {
    const token = result.data().token
    tokens.push(token)
  })

  return admin.messaging().sendToDevice(tokens, payload)
}

module.exports = sendNotification
