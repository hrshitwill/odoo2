const StockLedger = require('../../models/StockLedger');
const StockOperation = require('../../models/StockOperation');

// @desc    Get Stock Ledger / Move History with advanced filters and pagination (Manager ONLY)
// @route   GET /api/ledger
exports.getLedger = async (req, res, next) => {
  try {
    // Role check: Only managers can view full stock ledger
    if (req.user && req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Access restricted: Only Inventory Managers can view the complete corporate Stock Ledger. Staff can view their own activity under My Activity.',
      });
    }

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

// @desc    Get Staff member's own operational activity ("My Activity")
// @route   GET /api/ledger/my-activity
exports.getMyActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all operations submitted by or created by this user
    const operations = await StockOperation.find({
      $or: [{ submittedBy: userId }, { createdBy: userId }],
    })
      .populate('items.product', 'name sku uom')
      .populate('sourceLocation', 'name code')
      .populate('destLocation', 'name code')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(50);

    const activities = operations.map((op) => {
      const date = op.submittedAt || op.updatedAt || op.createdAt;
      const timeStr = new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      let actionDesc = '';
      if (op.type === 'RECEIPT') {
        actionDesc = 'Receipt submitted';
      } else if (op.type === 'DELIVERY') {
        actionDesc = op.stage === 'pack' ? 'Delivery packed' : 'Delivery submitted';
      } else if (op.type === 'INTERNAL') {
        actionDesc = 'Transfer submitted';
      } else if (op.type === 'ADJUSTMENT') {
        actionDesc = 'Count submitted';
      } else {
        actionDesc = 'Operation submitted';
      }

      let statusDisplay = 'Awaiting approval';
      if (op.status === 'COMPLETED' || op.status === 'DONE' || op.status === 'APPROVED') {
        statusDisplay = 'Completed';
      } else if (op.status === 'REJECTED') {
        statusDisplay = 'Rejected';
      } else if (op.status === 'IN_PROGRESS') {
        statusDisplay = 'In Progress';
      } else if (op.status === 'READY') {
        statusDisplay = 'Ready';
      }

      return {
        id: op._id,
        reference: op.reference,
        type: op.type,
        timestamp: date,
        time: timeStr,
        action: actionDesc,
        status: statusDisplay,
        rawStatus: op.status,
        partner: op.partner,
        notes: op.notes,
        rejectionReason: op.rejectionReason,
        itemsCount: op.items.length,
      };
    });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};
