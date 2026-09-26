const express = require('express');
const router = express.Router();
const {
  getOperations,
  getOperation,
  createOperation,
  validateOperation,
  cancelOperation,
} = require('./operations.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(getOperations).post(createOperation);
router.route('/:id').get(getOperation);
router.route('/:id/validate').post(validateOperation);
router.route('/:id/cancel').post(cancelOperation);

module.exports = router;
