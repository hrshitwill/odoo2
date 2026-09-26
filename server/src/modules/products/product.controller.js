const Product = require('../../models/Product');
const StockQuant = require('../../models/StockQuant');
const StockLedger = require('../../models/StockLedger');
const Location = require('../../models/Location');

// @desc    Get all products with total on-hand stock and low stock flags
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

    if (category && category !== 'ALL') {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    // Get all internal location IDs to only sum actual physical stock
    const internalLocations = await Location.find({ type: 'INTERNAL' }).select('_id');
    const internalLocIds = internalLocations.map((l) => l._id);

    const productIds = products.map((p) => p._id);
    const quants = await StockQuant.aggregate([
      { $match: { product: { $in: productIds }, location: { $in: internalLocIds } } },
      { $group: { _id: '$product', totalStock: { $sum: '$quantity' } } },
    ]);

    const quantMap = {};
    quants.forEach((q) => {
      quantMap[q._id.toString()] = q.totalStock;
    });

    let result = products.map((p) => {
      const totalStock = quantMap[p._id.toString()] || 0;
      return {
        ...p,
        totalStock,
        isLowStock: totalStock <= (p.minStockRule || 0),
        isOutOfStock: totalStock === 0,
      };
    });

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

    const internalLocations = await Location.find({ type: 'INTERNAL' }).select('_id');
    const internalLocIds = internalLocations.map((l) => l._id);

    const locationQuants = await StockQuant.find({
      product: product._id,
      location: { $in: internalLocIds },
    })
      .populate('location', 'name code type warehouse')
      .lean();

    const totalStock = locationQuants.reduce((sum, q) => sum + (q.quantity || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...product.toObject(),
        totalStock,
        isLowStock: totalStock <= product.minStockRule,
        stockPerLocation: locationQuants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (with optional initial stock)
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const { name, sku, category, uom, minStockRule, maxStockRule, costPrice, description, initialStock, locationId } = req.body;

    const existingSku = await Product.findOne({ sku: sku.toUpperCase().trim() });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${sku.toUpperCase().trim()}' already exists`,
      });
    }

    const product = await Product.create({
      name,
      sku: sku.toUpperCase().trim(),
      category: category || 'General',
      uom: uom || 'Units',
      minStockRule: Number(minStockRule) || 0,
      maxStockRule: Number(maxStockRule) || 0,
      costPrice: Number(costPrice) || 0,
      description: description || '',
    });

    // Optional initial stock setup
    if (initialStock && Number(initialStock) > 0) {
      let targetLocationId = locationId;
      if (!targetLocationId) {
        // Find or create default internal location
        let defaultLoc = await Location.findOne({ type: 'INTERNAL' });
        if (!defaultLoc) {
          defaultLoc = await Location.create({
            name: 'Main Store',
            code: 'WH1/STOCK',
            type: 'INTERNAL',
          });
        }
        targetLocationId = defaultLoc._id;
      }

      await StockQuant.create({
        product: product._id,
        location: targetLocationId,
        quantity: Number(initialStock),
      });

      // Find or create vendor/inventory opening location for ledger reference
      let openingLoc = await Location.findOne({ type: 'VENDOR' });
      if (!openingLoc) {
        openingLoc = await Location.create({
          name: 'Vendors / Opening Balance',
          code: 'VENDOR/OPEN',
          type: 'VENDOR',
        });
      }

      await StockLedger.create({
        reference: `INIT-${product.sku}`,
        product: product._id,
        fromLocation: openingLoc._id,
        toLocation: targetLocationId,
        quantity: Number(initialStock),
        performedBy: req.user ? req.user._id : null,
        notes: 'Initial stock on product creation',
      });
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    if (req.body.sku) {
      req.body.sku = req.body.sku.toUpperCase().trim();
    }
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
    await StockLedger.deleteMany({ product: req.params.id });
    res.status(200).json({ success: true, message: 'Product and associated records removed' });
  } catch (error) {
    next(error);
  }
};
