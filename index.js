const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
// const routes = require('./routes')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

var whitelist = ['ionic://localhost', 'http://localhost:8080', 'http://localhost:4200', 'http://localhost:8100', 'http://localhost:8200', 'http://192.168.31.249:8100', 'https://anandvrindavan.com']
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
const eventRoutes = require('./routes/events')
const quoteRoutes = require('./routes/quotes')

mongoose.Promise = global.Promise

const port = process.env.PORT || 3050
const url = process.env.IP || '0.0.0.0'

app.use(function (req, res, next) {
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200')
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
app.use('/events', eventRoutes)
app.use('/quotes', quoteRoutes)

app.get('/healthcheck', function (req, res) {
  res.send(`api service running on ${url}:${port}`)
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
