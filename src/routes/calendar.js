const express = require('express');
const calendarController = require('../controllers/calendarController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', calendarController.getCalendarEvents);

module.exports = router;
