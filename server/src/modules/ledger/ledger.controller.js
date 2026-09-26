const StockLedger = require('../../models/StockLedger');

// @desc    Get Stock Ledger / Move History
// @route   GET /api/ledger
exports.getLedger = async (req, res, next) => {
  try {
    const { productId, locationId, limit = 50, page = 1 } = req.query;
    let query = {};

    if (productId) query.product = productId;
    if (locationId) {
      query.$or = [{ fromLocation: locationId }, { toLocation: locationId }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const moves = await StockLedger.find(query)
      .populate('product', 'name sku uom')
      .populate('fromLocation', 'name code type')
      .populate('toLocation', 'name code type')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StockLedger.countDocuments(query);

    res.status(200).json({
      success: true,
      count: moves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: moves,
    });
  } catch (error) {
    next(error);
  }
};
