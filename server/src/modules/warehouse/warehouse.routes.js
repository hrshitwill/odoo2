const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getLocations,
  createWarehouse,
  createLocation,
} = require('./warehouse.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(getWarehouses).post(authorize('INVENTORY_MANAGER'), createWarehouse);
router.route('/locations').get(getLocations).post(authorize('INVENTORY_MANAGER'), createLocation);

module.exports = router;
