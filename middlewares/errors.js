const dotenv = require('dotenv')
const ErrorHandler = require('../utils/errorHandler')

dotenv.config({ path: './config/config.env' })

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errorMessage: err.message,
      stack: err.stack
    })
  }

  if (process.env.NODE_ENV.trimEnd() == 'production') {
    // Handling Mongoose Object ID Erorrs
    if (err.name === 'CastError') {
      const message = `Resource not found. Invalid ${err.path}`
      err = new ErrorHandler(message, 404)
    }

    // Handling Mongoose duplicate key error
    if (err.code === 11000) {
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`
      err = new ErrorHandler(message, 400)
    }

    // Handling wrong JWT error
    if (err.name === 'JsonWebTokenError') {
      const message = 'JSON Web Token is invalid. Try Again!'
      err = new ErrorHandler(message, 500)
    }

    // Handling expired JWT error
    if (err.name === 'TokenExpiredError') {
      const message = 'JSON Web Token is expired. Please login again!'
      err = new ErrorHandler(message, 500)
    }

    // Handling Validation Erorrs
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(value => value.message)
      err = new ErrorHandler(message, 400)
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error'
    })
  }
}