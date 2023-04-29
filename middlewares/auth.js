const jwt = require('jsonwebtoken')
const User = require('../models/user')
const catchAsyncErrors = require('./catchAsyncErrors')
const ErrorHandler = require('../utils/errorHandler')

// Check if user is authenticated
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token || token === 'null') {
    return next(new ErrorHandler('Please login', 401))
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  req.user = await User.findById(decoded.id)

  next()
})

// Handling user role
exports.isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Role(${req.user.role}) is not allowed to access`, 403))
    }
    next()
  }
}