const admin = require('firebase-admin')

const sendDevices = async () => {

  // ref to the device collection for the user
  const db = admin.firestore()
  const devicesRef = db.collection('devices')

  // get the user's tokens and send notifications
  const devices = await devicesRef.get()
  let users = []
  devices.forEach(result => {
    users.push(result.data())
  })
  return {
    numberOfUsers: users.length,
    users,
  }
}

module.exports = sendDevices
