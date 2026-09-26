const StockQuant = require('../../models/StockQuant');
const StockLedger = require('../../models/StockLedger');
const StockOperation = require('../../models/StockOperation');
const Location = require('../../models/Location');
const Product = require('../../models/Product');

// Helper to get or create scrap/loss location
const getLossLocation = async () => {
  let lossLocation = await Location.findOne({ type: 'INVENTORY_LOSS' });
  if (!lossLocation) {
    lossLocation = await Location.create({
      name: 'Inventory Loss / Scrap',
      code: 'SCRAP/LOSS',
      type: 'INVENTORY_LOSS',
    });
  }
  return lossLocation;
};

// @desc    Get all adjustments (or scoped to warehouse for staff)
// @route   GET /api/adjustments
exports.getAdjustments = async (req, res, next) => {
  try {
    let query = { type: 'ADJUSTMENT' };

    if (req.user && req.user.role === 'WAREHOUSE_STAFF' && req.user.warehouse) {
      const whLocations = await Location.find({ warehouse: req.user.warehouse }).select('_id');
      const whLocIds = whLocations.map((l) => l._id);
      query.$or = [
        { warehouse: req.user.warehouse },
        { sourceLocation: { $in: whLocIds } },
        { destLocation: { $in: whLocIds } },
        { submittedBy: req.user._id },
      ];
    }

    const adjustments = await StockOperation.find(query)
      .populate('sourceLocation', 'name code type warehouse')
      .populate('destLocation', 'name code type warehouse')
      .populate('items.product', 'name sku uom')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: adjustments.length, data: adjustments });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform or submit stock adjustment between physical count and recorded count
// @route   POST /api/adjustments
exports.createAdjustment = async (req, res, next) => {
  try {
    const { productId, locationId, countedQty, reason } = req.body;

    if (!productId || !locationId || countedQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, locationId, and countedQty',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const lossLocation = await getLossLocation();

    let quant = await StockQuant.findOne({ product: productId, location: locationId });
    const recordedQty = quant ? quant.quantity : 0;
    const targetQty = Number(countedQty);
    const delta = targetQty - recordedQty; // Positive = gain, Negative = loss

    const ref = `ADJ-${Date.now().toString().slice(-6)}`;

    // STAFF WORKFLOW: Create request awaiting Manager approval. DO NOT MUTATE INVENTORY!
    if (req.user && req.user.role === 'WAREHOUSE_STAFF') {
      const operation = await StockOperation.create({
        reference: ref,
        type: 'ADJUSTMENT',
        status: 'AWAITING_APPROVAL',
        warehouse: location.warehouse || req.user.warehouse || null,
        sourceLocation: delta < 0 ? locationId : lossLocation._id,
        destLocation: delta < 0 ? lossLocation._id : locationId,
        items: [
          {
            product: productId,
            demandQty: Math.abs(delta),
            doneQty: Math.abs(delta),
          },
        ],
        systemQty: recordedQty,
        countedQty: targetQty,
        difference: delta,
        adjustmentReason: reason || 'Physical count discrepancy',
        notes: reason || `Count: ${recordedQty} -> ${targetQty} (${delta > 0 ? '+' : ''}${delta})`,
        submittedBy: req.user._id,
        submittedAt: new Date(),
        createdBy: req.user._id,
      });

      return res.status(201).json({
        success: true,
        message: `Physical count of ${targetQty} ${product.uom} submitted for Manager approval. Official inventory remains unchanged at ${recordedQty} ${product.uom}.`,
        data: {
          productId,
          productName: product.name,
          locationId,
          locationName: location.name,
          recordedQty,
          countedQty: targetQty,
          delta,
          status: 'AWAITING_APPROVAL',
          operation,
        },
      });
    }

    // MANAGER WORKFLOW: Manager can directly apply adjustment
    if (delta === 0) {
      return res.status(200).json({
        success: true,
        message: 'Physical count matches recorded quantity. No adjustment needed.',
        data: { recordedQty, countedQty: targetQty, delta: 0 },
      });
    }

    // Update quant to exact counted quantity
    if (!quant) {
      quant = new StockQuant({ product: productId, location: locationId, quantity: targetQty });
    } else {
      quant.quantity = targetQty;
    }
    await quant.save();

    const fromLoc = delta < 0 ? locationId : lossLocation._id;
    const toLoc = delta < 0 ? lossLocation._id : locationId;
    const adjQty = Math.abs(delta);

    // Record in Stock Ledger
    const ledgerEntry = await StockLedger.create({
      reference: ref,
      product: productId,
      fromLocation: fromLoc,
      toLocation: toLoc,
      quantity: adjQty,
      performedBy: req.user ? req.user._id : null,
      notes: reason || `Inventory Count Adjustment: ${recordedQty} -> ${targetQty} (${delta > 0 ? '+' : ''}${delta})`,
    });

    // Also record completed operation
    const op = await StockOperation.create({
      reference: ref,
      type: 'ADJUSTMENT',
      status: 'COMPLETED',
      warehouse: location.warehouse || null,
      sourceLocation: fromLoc,
      destLocation: toLoc,
      items: [{ product: productId, demandQty: adjQty, doneQty: adjQty }],
      systemQty: recordedQty,
      countedQty: targetQty,
      difference: delta,
      adjustmentReason: reason || 'Inventory Count Adjustment',
      approvedBy: req.user ? req.user._id : null,
      approvedAt: new Date(),
      validatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `Stock adjusted by ${delta > 0 ? '+' : ''}${delta} ${product.uom}. New stock: ${targetQty} ${product.uom}`,
      data: {
        productId,
        productName: product.name,
        locationId,
        locationName: location.name,
        recordedQty,
        countedQty: targetQty,
        delta,
        ledgerEntry,
        operation: op,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Stock Adjustment (Manager ONLY: Mutates official inventory)
// @route   POST /api/adjustments/:id/approve
exports.approveAdjustment = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Authority denied: Only an Inventory Manager can approve stock adjustments.',
      });
    }

    const operation = await StockOperation.findById(req.params.id);
    if (!operation || operation.type !== 'ADJUSTMENT') {
      return res.status(404).json({ success: false, message: 'Stock adjustment request not found' });
    }

    if (operation.status === 'COMPLETED' || operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Adjustment is already completed' });
    }

    const item = operation.items[0];
    if (!item) {
      return res.status(400).json({ success: false, message: 'Adjustment item missing' });
    }

    const lossLocation = await getLossLocation();
    const isLoss = operation.difference < 0;
    const physicalLocId = isLoss ? operation.sourceLocation : operation.destLocation;

    let quant = await StockQuant.findOne({ product: item.product, location: physicalLocId });
    const targetQty = operation.countedQty !== undefined ? operation.countedQty : (quant ? quant.quantity + operation.difference : 0);

    if (!quant) {
      quant = new StockQuant({ product: item.product, location: physicalLocId, quantity: targetQty });
    } else {
      quant.quantity = targetQty;
    }
    await quant.save();

    // Create Stock Ledger entry
    const ledgerEntry = await StockLedger.create({
      operation: operation._id,
      reference: operation.reference,
      product: item.product,
      fromLocation: operation.sourceLocation,
      toLocation: operation.destLocation,
      quantity: Math.abs(operation.difference || item.doneQty),
      performedBy: req.user._id,
      notes: `Adjustment approved by Manager ${req.user.name}: ${operation.adjustmentReason || operation.notes}`,
    });

    operation.status = 'COMPLETED';
    operation.approvedBy = req.user._id;
    operation.approvedAt = new Date();
    operation.validatedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: `Adjustment approved. Official inventory updated to ${targetQty}.`,
      data: { operation, ledgerEntry },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject Stock Adjustment (Manager ONLY)
// @route   POST /api/adjustments/:id/reject
exports.rejectAdjustment = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Authority denied: Only an Inventory Manager can reject stock adjustments.',
      });
    }

    const operation = await StockOperation.findById(req.params.id);
    if (!operation || operation.type !== 'ADJUSTMENT') {
      return res.status(404).json({ success: false, message: 'Stock adjustment request not found' });
    }

    operation.status = 'REJECTED';
    operation.rejectionReason = req.body.reason || 'Count discrepancy rejected by Manager';
    operation.rejectedBy = req.user._id;
    operation.rejectedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: 'Adjustment rejected. Official inventory remains unchanged.',
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};
