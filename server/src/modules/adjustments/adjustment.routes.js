const express = require('express');
const router = express.Router();
const {
  getAdjustments,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
} = require('./adjustment.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(getAdjustments).post(createAdjustment);
router.route('/:id/approve').post(authorize('INVENTORY_MANAGER'), approveAdjustment);
router.route('/:id/reject').post(authorize('INVENTORY_MANAGER'), rejectAdjustment);

module.exports = router;
