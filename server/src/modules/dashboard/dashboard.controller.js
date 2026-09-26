const Product = require('../../models/Product');
const StockQuant = require('../../models/StockQuant');
const StockOperation = require('../../models/StockOperation');
const Location = require('../../models/Location');

// @desc    Get dashboard KPIs and metrics
// @route   GET /api/dashboard/kpis
exports.getDashboardKpis = async (req, res, next) => {
  try {
    const { warehouseId, locationId, category } = req.query;

    // 1. Total products count (optionally filtered by category)
    let productQuery = {};
    if (category && category !== 'ALL') {
      productQuery.category = category;
    }
    const totalProducts = await Product.countDocuments(productQuery);

    // 2. Pending operations counts
    let opQuery = {};
    if (warehouseId || locationId) {
      const locMatch = locationId || { $exists: true };
      opQuery.$or = [{ sourceLocation: locMatch }, { destLocation: locMatch }];
    }

    const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
      StockOperation.countDocuments({
        ...opQuery,
        type: 'RECEIPT',
        status: { $in: ['DRAFT', 'WAITING', 'READY'] },
      }),
      StockOperation.countDocuments({
        ...opQuery,
        type: 'DELIVERY',
        status: { $in: ['DRAFT', 'WAITING', 'READY'] },
      }),
      StockOperation.countDocuments({
        ...opQuery,
        type: 'INTERNAL',
        status: { $in: ['DRAFT', 'WAITING', 'READY'] },
      }),
    ]);

    // 3. Status breakdown across all operations
    const statusCounts = await StockOperation.aggregate([
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Low stock and Out of stock items calculation
    const products = await Product.find(productQuery).select('minStockRule category').lean();
    const internalLocations = await Location.find({ type: 'INTERNAL' }).select('_id');
    const internalLocIds = internalLocations.map((l) => l._id);

    const quants = await StockQuant.aggregate([
      { $match: { location: { $in: internalLocIds } } },
      { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    ]);

    const quantMap = {};
    quants.forEach((q) => {
      quantMap[q._id.toString()] = q.total;
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalItemsInStock = 0;

    products.forEach((p) => {
      const stock = quantMap[p._id.toString()] || 0;
      totalItemsInStock += stock;
      if (stock === 0) outOfStockCount++;
      if (stock <= (p.minStockRule || 0)) lowStockCount++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalItemsInStock,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
        statusBreakdown: statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};
