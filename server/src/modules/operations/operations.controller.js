const StockOperation = require('../../models/StockOperation');
const StockQuant = require('../../models/StockQuant');
const StockLedger = require('../../models/StockLedger');
const Location = require('../../models/Location');
const Product = require('../../models/Product');

// Helper to update stock quant safely
const updateStockQuant = async (productId, locationId, deltaQty) => {
  let quant = await StockQuant.findOne({ product: productId, location: locationId });
  if (!quant) {
    quant = new StockQuant({ product: productId, location: locationId, quantity: 0 });
  }
  quant.quantity += deltaQty;
  if (quant.quantity < 0) {
    quant.quantity = 0; // Safeguard against negative balances
  }
  await quant.save();
  return quant;
};

// @desc    Get all stock operations with dynamic filters
// @route   GET /api/operations
exports.getOperations = async (req, res, next) => {
  try {
    const { type, status, warehouse, location, search } = req.query;
    let query = {};

    if (type && type !== 'ALL') query.type = type.toUpperCase();
    if (status && status !== 'ALL') query.status = status.toUpperCase();

    if (location) {
      query.$or = [{ sourceLocation: location }, { destLocation: location }];
    }

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { partner: { $regex: search, $options: 'i' } },
      ];
    }

    const operations = await StockOperation.find(query)
      .populate('sourceLocation', 'name code type')
      .populate('destLocation', 'name code type')
      .populate('items.product', 'name sku uom minStockRule')
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
      .populate('items.product', 'name sku uom minStockRule')
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

    if (!type || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide operation type and at least one item line',
      });
    }

    // Default location fallbacks if not provided
    let srcLoc = sourceLocation;
    let dstLoc = destLocation;

    if (type === 'RECEIPT') {
      if (!srcLoc) {
        let vendorLoc = await Location.findOne({ type: 'VENDOR' });
        if (!vendorLoc) {
          vendorLoc = await Location.create({ name: 'Vendors', code: 'VENDOR', type: 'VENDOR' });
        }
        srcLoc = vendorLoc._id;
      }
      if (!dstLoc) {
        let internalLoc = await Location.findOne({ type: 'INTERNAL' });
        if (!internalLoc) {
          internalLoc = await Location.create({ name: 'Main Store', code: 'WH1/STOCK', type: 'INTERNAL' });
        }
        dstLoc = internalLoc._id;
      }
    } else if (type === 'DELIVERY') {
      if (!srcLoc) {
        let internalLoc = await Location.findOne({ type: 'INTERNAL' });
        if (!internalLoc) {
          internalLoc = await Location.create({ name: 'Main Store', code: 'WH1/STOCK', type: 'INTERNAL' });
        }
        srcLoc = internalLoc._id;
      }
      if (!dstLoc) {
        let custLoc = await Location.findOne({ type: 'CUSTOMER' });
        if (!custLoc) {
          custLoc = await Location.create({ name: 'Customers', code: 'CUSTOMER', type: 'CUSTOMER' });
        }
        dstLoc = custLoc._id;
      }
    }

    if (!srcLoc || !dstLoc) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination locations are required',
      });
    }

    // Generate auto reference number (e.g. REC-100234, DEL-100234, INT-100234)
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
      status: 'READY',
      partner: partner || '',
      sourceLocation: srcLoc,
      destLocation: dstLoc,
      items: items.map((i) => ({
        product: i.product,
        demandQty: Number(i.demandQty || i.quantity || 1),
        doneQty: Number(i.doneQty || i.demandQty || i.quantity || 1),
      })),
      notes: notes || '',
      createdBy: req.user ? req.user._id : null,
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

    if (!sourceLoc || !destLoc) {
      return res.status(400).json({ success: false, message: 'Source or destination location missing' });
    }

    // Stock availability validation: If source is INTERNAL (Delivery or Internal Transfer), verify enough stock exists!
    if (sourceLoc.type === 'INTERNAL') {
      for (let item of operation.items) {
        const requiredQty = item.doneQty > 0 ? item.doneQty : item.demandQty;
        const quant = await StockQuant.findOne({ product: item.product, location: sourceLoc._id });
        const availableQty = quant ? quant.quantity : 0;

        if (availableQty < requiredQty) {
          const product = await Product.findById(item.product);
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product '${product ? product.name : item.product}' at location '${sourceLoc.name}'. Available: ${availableQty}, Required: ${requiredQty}`,
          });
        }
      }
    }

    // Process movements for each line item
    for (let item of operation.items) {
      const moveQty = item.doneQty > 0 ? item.doneQty : item.demandQty;
      item.doneQty = moveQty;

      // 1. Decrement source if INTERNAL
      if (sourceLoc.type === 'INTERNAL') {
        await updateStockQuant(item.product, sourceLoc._id, -moveQty);
      }

      // 2. Increment destination if INTERNAL
      if (destLoc.type === 'INTERNAL') {
        await updateStockQuant(item.product, destLoc._id, moveQty);
      }

      // 3. Record in Stock Ledger audit trail
      await StockLedger.create({
        operation: operation._id,
        reference: operation.reference,
        product: item.product,
        fromLocation: operation.sourceLocation,
        toLocation: operation.destLocation,
        quantity: moveQty,
        performedBy: req.user ? req.user._id : null,
        notes: `${operation.type} completed`,
      });
    }

    operation.status = 'DONE';
    operation.validatedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: `${operation.type} operation validated and stock successfully updated`,
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
