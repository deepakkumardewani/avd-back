const admin = require('firebase-admin')

const sendNotification = async (title, body, data) => {
  const payload = {
    data,
    notification: {
      title,
      body
    }
  }

  // ref to the device collection for the user
  const db = admin.firestore()
  const devicesRef = db.collection('devices')

  // get the user's tokens and send notifications
  const devices = await devicesRef.get()
  let tokens = []
  const devicesArray = []

  while (devices.docs.length > 0) {
    const chunk = devices.docs.splice(0, 1000)
    devicesArray.push(chunk)
  }

  devicesArray.forEach(result => {
    tokens = []
    result.forEach(data => {
      const token = data.data().token
      tokens.push(token)
    })
    admin.messaging().sendToDevice(tokens, payload)
  })

  // send a notification to each device token
  // devices.forEach(result => {
  //   const token = result.data().token
  //   tokens.push(token)
  // })

  // return admin.messaging().sendToDevice(tokens, payload)
}

module.exports = sendNotification
