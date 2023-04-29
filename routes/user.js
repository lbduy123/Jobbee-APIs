const express = require('express')
const router = express.Router()

const { getUserProfile, updatePassword, updateUser, deleteUser, getAppliedJobs, getPublishedJobs, getUsers, deleteUserById } = require('../controllers/userController')
const { isAuthenticated, isAuthorized } = require('../middlewares/auth')

router.use(isAuthenticated)

router.route('/me').get(getUserProfile)
router.route('/password/change').put(updatePassword)
router.route('/me/update').put(updateUser)
router.route('/me/delete').delete(deleteUser)

router.route('/me/applied').get(isAuthorized('user'), getAppliedJobs)
router.route('/me/published').get(isAuthorized('employer', 'admin'), getPublishedJobs)

// Admin routes
router.route('/users').get(isAuthorized('admin'), getUsers)
router.route('/user/:id').delete(isAuthorized('admin'), deleteUserById)

module.exports = router