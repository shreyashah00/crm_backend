const express = require('express');
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, notificationController.getNotifications);

module.exports = router;
