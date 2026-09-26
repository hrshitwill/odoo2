const Product = require('../../models/Product');
const StockQuant = require('../../models/StockQuant');

// @desc    Get all products with stock on hand
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, lowStock } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).lean();

    // Attach total quantity on hand across all internal locations
    const productIds = products.map((p) => p._id);
    const quants = await StockQuant.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: '$product', totalStock: { $sum: '$quantity' } } },
    ]);

    const quantMap = {};
    quants.forEach((q) => {
      quantMap[q._id.toString()] = q.totalStock;
    });

    let result = products.map((p) => ({
      ...p,
      totalStock: quantMap[p._id.toString()] || 0,
      isLowStock: (quantMap[p._id.toString()] || 0) <= p.minStockRule,
    }));

    if (lowStock === 'true') {
      result = result.filter((p) => p.isLowStock);
    }

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details with per-location stock
// @route   GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const locationQuants = await StockQuant.find({ product: product._id })
      .populate('location', 'name code type')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        stockPerLocation: locationQuants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await StockQuant.deleteMany({ product: req.params.id });
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
