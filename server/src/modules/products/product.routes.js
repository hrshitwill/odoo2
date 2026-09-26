const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('./product.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');

router
  .route('/')
  .get(protect, getProducts)
  .post(protect, authorize('INVENTORY_MANAGER'), createProduct);

router
  .route('/:id')
  .get(protect, getProduct)
  .put(protect, authorize('INVENTORY_MANAGER'), updateProduct)
  .delete(protect, authorize('INVENTORY_MANAGER'), deleteProduct);

module.exports = router;
