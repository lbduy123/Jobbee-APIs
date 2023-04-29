const express = require('express')
const router = express.Router()

const { getJobs, newJob, getJobsInRadius, updateJob, deleteJob, getJob, jobStat, applyJob } = require('../controllers/jobsController')

const { isAuthenticated, isAuthorized } = require('../middlewares/auth')

router.route('/jobs').get(isAuthenticated, getJobs)
router.route('/job/:id/:slug').get(isAuthenticated, getJob)
router.route('/job/new').post(isAuthenticated, isAuthorized('employer', 'admin'), newJob)
router.route('/jobs/:zipcode/:distance').get(isAuthenticated, getJobsInRadius)
router.route('/stats/:topic').get(isAuthenticated, jobStat)

router.route('/job/:id')
  .put(isAuthenticated, isAuthorized('employer', 'admin'), updateJob)
  .delete(isAuthenticated, isAuthorized('employer', 'admin'), deleteJob)
router.route('/job/:id/apply').put(isAuthenticated, isAuthorized('user'), applyJob)

module.exports = router