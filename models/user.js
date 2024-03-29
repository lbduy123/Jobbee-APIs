const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    validate: [validator.isEmail, 'Please enter valid email address']
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'employer'],
      message: 'Please select correct role'
    },
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

userSchema.pre("save", async function (next) {

  if (!this.isModified('password')) {
    next()
  }

  this.password = await bcrypt.hash(this.password, 10)
})

// Return JSON Web token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id, }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME
  })
}

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPw) {
  return await bcrypt.compare(enteredPw, this.password)
}

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set token expire time
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

  return resetToken
}

// Show all jobs created by user using virtuals
userSchema.virtual('jobsPublished', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'user',
  justOne: false
})

module.exports = mongoose.model('User', userSchema)