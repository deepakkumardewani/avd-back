// if (!process.env.NODE_ENV) {
// 	process.env.NODE_ENV = "development"
// }
const env = process.env.NODE_ENV || 'development'
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const os = require('os')

// const routes = require('./routes')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const admin = require('firebase-admin')

const sendNotification = require('./helpers/notification')
const sendDevices = require('./helpers/devices')
const Darshan = require('./models/darshan')
const messages = require('./helpers/messages')
const serviceAccount = env === "development" ? require("./secrets/firebase-adminsdk.json") : require('/secrets/avd/anand-vrindavan-dham-firebase-adminsdk.json')

const config =
  env === "development" ? require("./secrets/config") : require("/secrets/avd/config");

global.config = config;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://anand-vrindavan-dham.firebaseio.com'
})

var whitelist = ['http://localhost', 'ionic://localhost', 'http://localhost:8080', 'http://localhost:4200', 'http://localhost:8100', 'http://localhost:8200', 'http://192.168.31.249:8100', 'http://169.254.190.158:8100', 'https://www.anandvrindavan.com', 'https://anandvrindavan.com', 'http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}

app.use(cors(corsOptions))

const photoRoutes = require('./routes/photos')
const lectureRoutes = require('./routes/lectures')
// const eventRoutes = require('./routes/events')
// const quoteRoutes = require('./routes/quotes')

mongoose.Promise = global.Promise

const port = process.env.PORT || 3050
const url = process.env.IP || '0.0.0.0'

app.use(function (req, res, next) {
  // res.setHeader('Access-Control-Allow-Origin', '*')
  // res.setHeader('Access-Control-Allow-Origin', 'https://anandvrindvan.com')
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, GET, PUT')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, albumtitle', 'audiotitle'
  )
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

// app.use(multer({dest: ''}).single('file'))
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: false
  })
)
app.use(cookieParser())

app.use(express.static('public'))
// connect to mongo when app initializes
var mongoURI = 'mongodb://localhost:27017/local'
mongoose.connect(mongoURI, {
  useMongoClient: true
})

var db = mongoose.connection
db.on('error', function () {
  throw new Error('unable to connect to database at ' + mongoURI)
})
db.once('open', function () {
  // we're connected!
  console.log("we're connected!")
})

// app.use('/', routes)
app.use('/photos', photoRoutes)
app.use('/lectures', lectureRoutes)
// app.use('/events', eventRoutes)
// app.use('/quotes', quoteRoutes)

app.post('/notification', async function (req, res) {
  const { title, subtitle, page } = req.body
  const data = { page }
  res.json({data: await sendNotification(title, subtitle, data)})
})

app.get('/devices', async function (req, res) {
  res.json({data: await sendDevices()})
})

app.post('/contact', async function (req, res) {
  res.json({data: await messages.add(req.body.data)})
})

app.get('/messages', async function (req, res) {
  res.json({data: await messages.get()})
})


app.post('/dwadashi', async function (req, res) {
  const { start, end } = req.body
  const title = 'Hare Krishna'
  // const subtitle = `Dwadashi timings are 7:04 AM to 11:05 AM.`
  const subtitle = `Dwadashi timings are from ${start} to ${end}.`
  // res.json({data: await sendNotification(title, subtitle)})
  return res.status(200).json({ subtitle })
})

app.get('/healthcheck', async function (req, res) {
  try {
    const dailyDarshan = await Darshan.findOne({}).sort({
      createdAt: -1
    })
    return res.status(200).json({
      'responseCode': 0,
      'responseDesc': `${os.hostname()} is running`
    })
  } catch (error) {
    return res.status(500).send({
      'responseCode': 1,
      'responseDesc': `${os.hostname()} DB is not accessible`
    })
  }
})

/* catch 404 and forward to error handler */
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.listen(port, () => {
  console.log(`API service running on localhost:${port}`)
})
