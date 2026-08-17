const express = require('express');
const userController = require('../controllers/userController');
const { auth, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema } = require('../validators/authValidator');

const router = express.Router();

// All user routes require authentication
router.use(auth);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// ADMIN only can create new staff
router.post('/', restrictTo('ADMIN'), validate(registerSchema), userController.createUser);

// ADMIN or MANAGER can update staff profiles
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), userController.updateUser);

module.exports = router;
