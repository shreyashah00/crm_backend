const express = require('express');
const staffController = require('../controllers/staffController');
const { auth, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateTargetSchema } = require('../validators/targetValidator');

const router = express.Router();

// All staff performance routes require authentication
router.use(auth);

router.get('/leaderboard', staffController.getLeaderboard);
router.get('/me/work', staffController.getStaffWorkspace);
router.get('/:id/performance', staffController.getStaffPerformance);

// Only ADMIN and MANAGER can set monthly targets for staff
router.put('/:id/target', restrictTo('ADMIN', 'MANAGER'), validate(updateTargetSchema), staffController.saveTarget);

module.exports = router;
