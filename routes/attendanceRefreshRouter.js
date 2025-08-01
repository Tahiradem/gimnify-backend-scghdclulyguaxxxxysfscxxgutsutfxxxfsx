const express = require ('express')
const router = express.Router()
const cron = require('node-cron')
const attendanceRefresher = require('../controllers/attendanceRefreshController')

cron.schedule('0 0 * * *', () => {
    attendanceRefresher()
    console.log("All attendances turned into false")
})

module.exports = router;