const express = require('express');
const router = express.Router();
const { createAdjustment } = require('./adjustment.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect);
router.post('/', authorize('INVENTORY_MANAGER', 'WAREHOUSE_STAFF'), createAdjustment);

module.exports = router;
