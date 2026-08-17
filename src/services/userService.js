const { prisma } = require('../lib/prisma');
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');

/**
 * Gets all users from the database
 */
async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      designation: true,
    },
  });
}

/**
 * Gets a user by ID
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      designation: true,
      target: true, // include monthly target if present
    },
  });

  if (!user) {
    throw ApiError.notFound('Staff member not found');
  }

  return user;
}

/**
 * Creates a new user/staff member
 */
async function createUser(data) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw ApiError.badRequest('Email is already in use', [
      { field: 'email', message: 'Email already exists' },
    ]);
  }

  // Hash default password (or provided password)
  const passwordToHash = data.password || 'password123';
  const hashedPassword = await bcrypt.hash(passwordToHash, 10);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      designation: data.designation,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      designation: true,
    },
  });

  // Create default monthly targets for the new user (except ADMINs)
  if (newUser.role !== 'ADMIN') {
    await prisma.target.create({
      data: {
        staffId: newUser.id,
        leadTarget: 25,      // default values
        followUpTarget: 40,
        meetingTarget: 10,
        conversionTarget: 5,
        revenueTarget: 0,
      },
    });
  }

  return newUser;
}

/**
 * Updates a user profile
 */
async function updateUser(id, data) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw ApiError.notFound('Staff member not found');
  }

  // If email is changing, check uniqueness
  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw ApiError.badRequest('Email is already in use', [
        { field: 'email', message: 'Email already exists' },
      ]);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      designation: data.designation,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      designation: true,
    },
  });

  return updatedUser;
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
};
