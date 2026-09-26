const Product = require('../../models/Product');
const StockQuant = require('../../models/StockQuant');
const StockOperation = require('../../models/StockOperation');

// @desc    Get dashboard KPIs and metrics
// @route   GET /api/dashboard/kpis
exports.getDashboardKpis = async (req, res, next) => {
  try {
    // 1. Total products count
    const totalProducts = await Product.countDocuments();

    // 2. Pending receipts (type: RECEIPT, status: in ['DRAFT', 'WAITING', 'READY'])
    const pendingReceipts = await StockOperation.countDocuments({
      type: 'RECEIPT',
      status: { $in: ['DRAFT', 'WAITING', 'READY'] },
    });

    // 3. Pending deliveries (type: DELIVERY, status: in ['DRAFT', 'WAITING', 'READY'])
    const pendingDeliveries = await StockOperation.countDocuments({
      type: 'DELIVERY',
      status: { $in: ['DRAFT', 'WAITING', 'READY'] },
    });

    // 4. Internal transfers scheduled
    const scheduledTransfers = await StockOperation.countDocuments({
      type: 'INTERNAL',
      status: { $in: ['DRAFT', 'WAITING', 'READY'] },
    });

    // 5. Low stock items calculation
    const products = await Product.find().select('minStockRule').lean();
    const quants = await StockQuant.aggregate([
      { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    ]);
    const quantMap = {};
    quants.forEach((q) => {
      quantMap[q._id.toString()] = q.total;
    });

    let lowStockCount = 0;
    let outOfStockCount = 0;
    products.forEach((p) => {
      const stock = quantMap[p._id.toString()] || 0;
      if (stock === 0) outOfStockCount++;
      if (stock <= p.minStockRule) lowStockCount++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
    });
  } catch (error) {
    next(error);
  }
};
