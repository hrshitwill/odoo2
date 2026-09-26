const StockLedger = require('../../models/StockLedger');

// @desc    Get Stock Ledger / Move History with advanced filters and pagination
// @route   GET /api/ledger
exports.getLedger = async (req, res, next) => {
  try {
    const { productId, locationId, reference, startDate, endDate, limit = 50, page = 1 } = req.query;
    let query = {};

    if (productId) query.product = productId;
    if (locationId) {
      query.$or = [{ fromLocation: locationId }, { toLocation: locationId }];
    }
    if (reference) {
      query.reference = { $regex: reference, $options: 'i' };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [moves, total] = await Promise.all([
      StockLedger.find(query)
        .populate('product', 'name sku uom')
        .populate('fromLocation', 'name code type')
        .populate('toLocation', 'name code type')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StockLedger.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: moves.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: moves,
    });
  } catch (error) {
    next(error);
  }
};
