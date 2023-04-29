const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler")
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto")

// Register new user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body
  let user = await User.create({
    name,
    email,
    password,
    role
  })

  sendToken(user, 200, res)
})

// Login -> /api/v1/login
exports.login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email & password', 400))
  }

  // Finding user in db
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401))
  }

  // Check pw
  const isPwMatched = await user.comparePassword(password)
  if (!isPwMatched) {
    return next(new ErrorHandler('Invalid email or password', 401))
  }

  // Create JWT
  sendToken(user, 200, res)
})

// Forgot password -> /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorHandler('User is not existed', 400))
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetToken}`

  const message = `Your password reset link is as follows:\n\n${resetUrl}
  \n\n If you have not request this, then please ignore that.`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Jobbee-API Password Reset',
      message
    })

    res.status(200).json({
      success: true,
      message: `Email sent successfully to ${user.email}`
    })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorHandler('Email not sent', 500))
  }
})

// Reset password -> /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Hash url token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  })

  if (!user) {
    return next(new ErrorHandler('Password reset token is invalid or expired', 400))
  }

  // Generate new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  sendToken(user, 200, res)
})

// Logout user -> /api/v1/logout
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
    httpOly: true
  })

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
})
