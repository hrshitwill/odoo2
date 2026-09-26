const express = require('express');
const router = express.Router();
const {
  getOperations,
  getOperation,
  createOperation,
  submitOperation,
  approveOperation,
  rejectOperation,
  validateOperation,
  cancelOperation,
} = require('./operations.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(getOperations).post(createOperation);
router.route('/:id').get(getOperation);
router.route('/:id/submit').post(submitOperation);
router.route('/:id/approve').post(authorize('INVENTORY_MANAGER'), approveOperation);
router.route('/:id/reject').post(authorize('INVENTORY_MANAGER'), rejectOperation);
router.route('/:id/validate').post(validateOperation);
router.route('/:id/cancel').post(cancelOperation);

module.exports = router;
