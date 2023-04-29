const express = require('express')
const app = express()

const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xssClean = require('xss-clean')
const hpp = require('hpp')
const cors = require('cors')
const bodyParser = require('body-parser')

const connectDatabase = require('./config/database')
const errorMiddleware = require('./middlewares/errors')
const ErrorHandler = require('./utils/errorHandler')
const jobs = require('./routes/jobs')
const auth = require('./routes/auth')
const user = require('./routes/user')

dotenv.config({ path: './config/config.env' })

// Handling Uncaught Exceptions
process.on('uncaughtException', err => {
  console.log(`Error: ${err.message}`)
  console.log('Shutting down server due to uncaught exception')
  process.exit(1)
})

connectDatabase()

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

app.use(helmet())

app.use(express.json())

app.use(cookieParser())

app.use(fileUpload())

app.use(mongoSanitize())

app.use(xssClean())

app.use(hpp({
  whitelist: ['position']
}))

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 150
})
app.use(limiter)

app.use(cors())

app.use('/api/v1', auth)
app.use('/api/v1', jobs)
app.use('/api/v1', user)

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404))
})

app.use(errorMiddleware)

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT} in ${process.env.NODE_ENV}`)
})

// Handling Unhandled promise rejection
process.on('unhandledRejection', err => {
  console.log(`Error: ${err.message}`)
  console.log('Shutting down server due to unhandled promise rejection')
  server.close(() => {
    process.exit(1)
  })
})