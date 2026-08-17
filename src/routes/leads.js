const express = require('express');
const leadController = require('../controllers/leadController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLeadSchema, updateLeadSchema, createActivitySchema } = require('../validators/leadValidator');

const router = express.Router();

// All lead routes require authentication
router.use(auth);

router.get('/', leadController.getLeads);
router.post('/', validate(createLeadSchema), leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.put('/:id', validate(updateLeadSchema), leadController.updateLead);
router.post('/:id/activities', validate(createActivitySchema), leadController.createLeadActivity);

module.exports = router;
