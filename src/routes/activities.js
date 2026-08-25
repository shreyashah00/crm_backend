const express = require('express');
const activityController = require('../controllers/activityController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', activityController.getActivities);
router.post('/', activityController.createActivity);

module.exports = router;
