const User = require('../models/user')
const catchAsyncErrors = require('../middlewares/catchAsyncErrors')
const ErrorHandler = require('../utils/errorHandler')
const sendToken = require('../utils/jwtToken')
const fs = require('fs')
const Job = require('../models/jobs')
const APIFilters = require('../utils/APIFilters')

// Get current user profile -> api/v1/me
exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate({
      path: 'jobsPublished',
      select: 'title postingDate'
    })

  res.status(200).json({
    success: true,
    user
  })
})

// Update current user password -> api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Check previous password
  const isMatched = await user.comparePassword(req.body.currentPassword)
  if (!isMatched) {
    return next(new ErrorHandler('Current password is incorrect', 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendToken(user, 200, res)
})

// Update current user data -> api/v1/me/update
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,  // return new user after updated
    runValidators: true,
    useFindAndModify: false // remove deprecated warning
  })

  res.status(200).json({
    success: true,
    user
  })
})

// Show all applied jobs -> api/v1/me/applied
exports.getAppliedJobs = catchAsyncErrors(async (req, res, next) => {

  const jobs = await Job.find({ 'applicantsApplied.id': req.user.id }).select('applicantsApplied')

  res.status(200).json({
    success: true,
    results: jobs.length,
    jobs
  })
})

// Show all user's published jobs -> api/v1/me/published
exports.getPublishedJobs = catchAsyncErrors(async (req, res, next) => {

  const jobs = await Job.find({ user: req.user.id })

  res.status(200).json({
    success: true,
    results: jobs.length,
    jobs
  })
})

// Show all users -> api/v1/users
exports.getUsers = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination()

  const users = await apiFilters.query

  res.status(200).json({
    success: true,
    results: users.length,
    users
  })
})

// Delete user by id -> api/v1/user/:id
exports.deleteUserById = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findByIdAndRemove(req.params.id)

  if (!user) {
    return next(new ErrorHandler('User not found', 404))
  }

  deleteUserData(user.id, user.role)
  await user.remove()

  res.status(200).json({
    success: true,
    message: 'User is deleted successfully'
  })
})

// Delete current user -> api/v1/me/delete
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {

  deleteUserData(req.user.id, req.user.role)

  const user = await User.findByIdAndDelete(req.user.id)

  res.cookie('token', 'none', {
    expires: new Date(Date.now()),
    httpOnly: true
  })

  res.status(200).json({
    success: true,
    message: 'Your account has been deleted'
  })
})

async function deleteUserData(userId, role) {
  if (role === 'employer') {
    await Job.deleteMany({ user: userId })
  }

  if (role === 'user') {
    const appliedJobs = await Job.find({ 'applicantsApplied.id': userId }).select('+applicantsApplied')

    for (const job of appliedJobs) {
      let obj = job.applicantsApplied.find(o => o.id === userId)
      let filePath = `${__dirname}/public/uploads/${obj.resume}`.replace('\\controllers', '')

      fs.unlink(filePath, err => {
        if (err) return console.log(err)
      })

      job.applicantsApplied.splice(job.applicantsApplied.findIndex(e => e.id === obj.id), 1)

      await job.save()
    }
  }
}