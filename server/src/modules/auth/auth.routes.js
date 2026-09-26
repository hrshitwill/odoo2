const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  getUsers,
  deleteUser,
  updateUser,
} = require('./auth.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

// Public routes for all operators
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile
router.get('/me', protect, getMe);

// Inventory Manager Only routes: Operator Provisioning & Directory
router.post('/register', protect, authorize('INVENTORY_MANAGER'), register);
router.get('/users', protect, authorize('INVENTORY_MANAGER'), getUsers);
router.put('/users/:id', protect, authorize('INVENTORY_MANAGER'), updateUser);
router.delete('/users/:id', protect, authorize('INVENTORY_MANAGER'), deleteUser);

module.exports = router;
