const pipelineService = require('../services/pipelineService');
const catchAsync = require('../utils/catchAsync');

const getPipeline = catchAsync(async (req, res) => {
  const pipeline = await pipelineService.getPipelineLeads(req.user);
  return res.status(200).json(pipeline);
});

const updateStage = catchAsync(async (req, res) => {
  const leadId = parseInt(req.params.id);
  const { status } = req.body;
  const result = await pipelineService.updateLeadStage(leadId, status, req.user);
  return res.status(200).json(result);
});

module.exports = {
  getPipeline,
  updateStage,
};
