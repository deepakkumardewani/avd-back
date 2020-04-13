const admin = require('firebase-admin');

const add = async (data) => {
  const { name, email, message } = data;
  const db = admin.firestore();
  let msg = {
    name,
    email,
    message,
  };

  try {
    await db.collection('messages').add(msg);
    return {
      msg: 'message added successfully!',
    };
  } catch (error) {
    return {
      error: 'error creating message',
    };
  }
};


const get = async() => {
  const db = admin.firestore()
  const messagesRef = db.collection('messages')
  const msgs = []
  try {
      const messages = await messagesRef.get()
      messages.forEach(result => {
          msgs.push(result.data())
      })
      return {
          msgs
      }
  } catch (error) {
    return { error }
  }

}
module.exports = { add, get };
