const express = require('express');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, switchRoleSchema, registerSchema, changePasswordSchema } = require('../validators/authValidator');

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post('/switch-role', validate(switchRoleSchema), authController.switchRole);
router.post('/register', validate(registerSchema), authController.register);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', auth, authController.getMe);
router.put('/change-password', auth, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
