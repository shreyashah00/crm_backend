const leadService = require('../services/leadService');
const { paginated } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const getLeads = catchAsync(async (req, res) => {
  const { q, status, page, size } = req.query;

  const result = await leadService.getLeads({
    q: q || '',
    status: status || '',
    page: page || 0,
    size: size || 25,
  });

  // Return paginated response
  return res.status(200).json(
    paginated(result.content, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    })
  );
});

const getLeadById = catchAsync(async (req, res) => {
  const leadId = parseInt(req.params.id);
  const lead = await leadService.getLeadById(leadId);
  return res.status(200).json(lead); // Frontend expects raw lead payload directly
});

const createLead = catchAsync(async (req, res) => {
  const newLead = await leadService.createLead(req.body, req.user);
  return res.status(201).json(newLead); // Frontend expects raw lead payload directly
});

const updateLead = catchAsync(async (req, res) => {
  const leadId = parseInt(req.params.id);
  const updatedLead = await leadService.updateLead(leadId, req.body, req.user);
  return res.status(200).json(updatedLead); // Frontend expects raw lead payload directly
});

const createLeadActivity = catchAsync(async (req, res) => {
  const leadId = parseInt(req.params.id);
  const updatedLead = await leadService.createLeadActivity(leadId, req.body, req.user);
  return res.status(201).json(updatedLead); // Frontend expects raw lead payload directly
});

const deleteLead = catchAsync(async (req, res) => {
  const leadId = parseInt(req.params.id);
  const result = await leadService.deleteLead(leadId, req.user);
  return res.status(200).json(result);
});

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  createLeadActivity,
};
