const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getMe } = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
