const express = require('express');
const pipelineController = require('../controllers/pipelineController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', pipelineController.getPipeline);
router.put('/:id/status', pipelineController.updateStage);

module.exports = router;
