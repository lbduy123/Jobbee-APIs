const express = require('express')
const { registerUser, login, forgotPassword, resetPassword, logout } = require('../controllers/authController')
const { isAuthenticated } = require('../middlewares/auth')
const router = express.Router()

router.route('/register').post(registerUser)
router.route('/login').post(login)
router.route('/logout').get(isAuthenticated, logout)

router.route('/password/forgot').post(forgotPassword)
router.route('/password/reset/:token').post(resetPassword)

module.exports = router