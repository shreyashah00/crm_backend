const userService = require('../services/userService');
const { success } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  return res.status(200).json(users); // Frontend expects the raw array directly on GET /users
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(parseInt(req.params.id));
  return res.status(200).json(user); // Frontend expects the raw user object directly on GET /users/:id
});

const createUser = catchAsync(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  return res.status(201).json(newUser); // Frontend expects the raw created user object directly on POST /users
});

const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUser(parseInt(req.params.id), req.body);
  return res.status(200).json(updatedUser); // Frontend expects the raw updated user object directly on PUT /users/:id
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
};
