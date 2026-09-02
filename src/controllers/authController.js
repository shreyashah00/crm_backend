const authService = require('../services/authService');
const { success } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const cookieSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';

const login = catchAsync(async (req, res) => {
  const { token, refreshToken, user } = await authService.login(req.body);

  // Set HTTP-only cookies for security
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Return standard response structure matching the frontend
  return res.status(200).json(
    success('Login successful', {
      token,
      user,
    })
  );
});

const register = catchAsync(async (req, res) => {
  const { token, refreshToken, user } = await authService.register(req.body);

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(201).json(
    success('User registered successfully', {
      token,
      user,
    })
  );
});

const refresh = catchAsync(async (req, res) => {
  // Read token from request body or cookies
  const tokenValue = req.body.refreshToken || req.cookies.refresh_token;
  const { token } = await authService.refreshAccessToken(tokenValue);

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  return res.status(200).json(
    success('Token refreshed successfully', { token })
  );
});

const getMe = catchAsync(async (req, res) => {
  // req.user is populated by the auth middleware
  return res.status(200).json(req.user); // The frontend expects the bare user object returned directly on GET /auth/me
});

const changePassword = catchAsync(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  return res.status(200).json(
    success('Password updated successfully', result)
  );
});

const logout = catchAsync(async (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('crm_token');

  return res.status(200).json(
    success('Logged out successfully')
  );
});

const switchRole = catchAsync(async (req, res) => {
  const { token, refreshToken, user } = await authService.switchRole(req.body);

  res.cookie('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json(
    success('Perspective switched successfully', {
      token,
      user,
    })
  );
});

module.exports = {
  login,
  switchRole,
  register,
  refresh,
  getMe,
  changePassword,
  logout,
};
