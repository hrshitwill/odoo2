const StockOperation = require('../../models/StockOperation');
const StockQuant = require('../../models/StockQuant');
const StockLedger = require('../../models/StockLedger');
const Location = require('../../models/Location');

// Helper to update stock quant safely
const updateStockQuant = async (productId, locationId, deltaQty) => {
  let quant = await StockQuant.findOne({ product: productId, location: locationId });
  if (!quant) {
    quant = new StockQuant({ product: productId, location: locationId, quantity: 0 });
  }
  quant.quantity += deltaQty;
  if (quant.quantity < 0) {
    quant.quantity = 0; // prevent negative stock
  }
  await quant.save();
  return quant;
};

// @desc    Get all stock operations with dynamic filters
// @route   GET /api/operations
exports.getOperations = async (req, res, next) => {
  try {
    const { type, status, warehouse, location } = req.query;
    let query = {};

    if (type) query.type = type.toUpperCase();
    if (status) query.status = status.toUpperCase();

    if (location) {
      query.$or = [{ sourceLocation: location }, { destLocation: location }];
    }

    const operations = await StockOperation.find(query)
      .populate('sourceLocation', 'name code type')
      .populate('destLocation', 'name code type')
      .populate('items.product', 'name sku uom')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: operations.length, data: operations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single operation by ID
// @route   GET /api/operations/:id
exports.getOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id)
      .populate('sourceLocation', 'name code type')
      .populate('destLocation', 'name code type')
      .populate('items.product', 'name sku uom')
      .populate('createdBy', 'name email');

    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Stock Operation (Receipt / Delivery / Internal)
// @route   POST /api/operations
exports.createOperation = async (req, res, next) => {
  try {
    const { type, partner, sourceLocation, destLocation, items, notes } = req.body;

    // Generate auto reference number (e.g. REC-17294829, DEL-17294829, INT-17294829)
    const prefixMap = {
      RECEIPT: 'REC',
      DELIVERY: 'DEL',
      INTERNAL: 'INT',
      ADJUSTMENT: 'ADJ',
    };
    const prefix = prefixMap[type] || 'OP';
    const reference = `${prefix}-${Date.now().toString().slice(-6)}`;

    const operation = await StockOperation.create({
      reference,
      type,
      status: 'DRAFT',
      partner,
      sourceLocation,
      destLocation,
      items,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate Stock Operation (Applies stock movements and writes to Ledger)
// @route   POST /api/operations/:id/validate
exports.validateOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Operation is already completed' });
    }

    if (operation.status === 'CANCELED') {
      return res.status(400).json({ success: false, message: 'Cannot validate a canceled operation' });
    }

    const sourceLoc = await Location.findById(operation.sourceLocation);
    const destLoc = await Location.findById(operation.destLocation);

    // Process movements for each line item
    for (let item of operation.items) {
      const moveQty = item.doneQty > 0 ? item.doneQty : item.demandQty;
      item.doneQty = moveQty;

      // If source is INTERNAL, stock decreases from source
      if (sourceLoc && sourceLoc.type === 'INTERNAL') {
        await updateStockQuant(item.product, sourceLoc._id, -moveQty);
      }

      // If dest is INTERNAL, stock increases at dest
      if (destLoc && destLoc.type === 'INTERNAL') {
        await updateStockQuant(item.product, destLoc._id, moveQty);
      }

      // Record in Stock Ledger audit trail
      await StockLedger.create({
        operation: operation._id,
        reference: operation.reference,
        product: item.product,
        fromLocation: operation.sourceLocation,
        toLocation: operation.destLocation,
        quantity: moveQty,
        performedBy: req.user._id,
        notes: `${operation.type} validated`,
      });
    }

    operation.status = 'DONE';
    operation.validatedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: 'Operation validated and stock successfully updated',
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel operation
// @route   POST /api/operations/:id/cancel
exports.cancelOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }
    if (operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed operation' });
    }
    operation.status = 'CANCELED';
    await operation.save();
    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};
