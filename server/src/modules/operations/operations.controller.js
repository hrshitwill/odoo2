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

// @desc    Get all stock operations with dynamic filters and warehouse scoping
// @route   GET /api/operations
exports.getOperations = async (req, res, next) => {
  try {
    const { type, status, warehouse, location, search } = req.query;
    let query = {};

    if (type && type !== 'ALL') query.type = type.toUpperCase();

    if (status && status !== 'ALL') {
      const upStatus = status.toUpperCase();
      if (upStatus === 'PENDING_REVIEW' || upStatus === 'AWAITING_APPROVAL') {
        query.status = { $in: ['AWAITING_APPROVAL', 'WAITING'] };
      } else if (upStatus === 'COMPLETED' || upStatus === 'DONE') {
        query.status = { $in: ['COMPLETED', 'DONE', 'APPROVED'] };
      } else {
        query.status = upStatus;
      }
    }

    if (location) {
      query.$or = [{ sourceLocation: location }, { destLocation: location }];
    }

    // Role-based warehouse scoping
    if (req.user && req.user.role === 'WAREHOUSE_STAFF') {
      if (req.user.warehouse) {
        const whLocations = await Location.find({ warehouse: req.user.warehouse }).select('_id');
        const whLocIds = whLocations.map((l) => l._id);

        const scopeCondition = {
          $or: [
            { warehouse: req.user.warehouse },
            { sourceLocation: { $in: whLocIds } },
            { destLocation: { $in: whLocIds } },
            { submittedBy: req.user._id },
            { createdBy: req.user._id },
          ],
        };

        if (query.$or) {
          query = { $and: [{ $or: query.$or }, scopeCondition] };
        } else {
          query = { ...query, ...scopeCondition };
        }
      }
    } else if (warehouse && warehouse !== 'all') {
      const whLocations = await Location.find({ warehouse }).select('_id');
      const whLocIds = whLocations.map((l) => l._id);
      query.$or = [
        { warehouse },
        { sourceLocation: { $in: whLocIds } },
        { destLocation: { $in: whLocIds } },
      ];
    }

    if (search) {
      const searchCondition = {
        $or: [
          { reference: { $regex: search, $options: 'i' } },
          { partner: { $regex: search, $options: 'i' } },
        ],
      };
      if (query.$and) {
        query.$and.push(searchCondition);
      } else if (query.$or) {
        query = { $and: [{ $or: query.$or }, searchCondition] };
      } else {
        query = { ...query, ...searchCondition };
      }
    }

    const operations = await StockOperation.find(query)
      .populate('sourceLocation', 'name code type warehouse')
      .populate('destLocation', 'name code type warehouse')
      .populate('items.product', 'name sku uom minStockRule')
      .populate('createdBy', 'name email role')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('warehouse', 'name code')
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
      .populate({
        path: 'sourceLocation',
        select: 'name code type warehouse',
        populate: { path: 'warehouse', select: 'name code' },
      })
      .populate({
        path: 'destLocation',
        select: 'name code type warehouse',
        populate: { path: 'warehouse', select: 'name code' },
      })
      .populate('items.product', 'name sku uom minStockRule')
      .populate('createdBy', 'name email role')
      .populate('submittedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('warehouse', 'name code');

    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    // Enforce warehouse scope for staff
    if (req.user && req.user.role === 'WAREHOUSE_STAFF' && req.user.warehouse) {
      const srcWh = operation.sourceLocation?.warehouse?._id?.toString() || operation.sourceLocation?.warehouse?.toString();
      const dstWh = operation.destLocation?.warehouse?._id?.toString() || operation.destLocation?.warehouse?.toString();
      const opWh = operation.warehouse?._id?.toString() || operation.warehouse?.toString();
      const userWh = req.user.warehouse.toString();

      const isAllowed =
        opWh === userWh ||
        srcWh === userWh ||
        dstWh === userWh ||
        (operation.submittedBy && operation.submittedBy._id.toString() === req.user._id.toString()) ||
        (operation.createdBy && operation.createdBy._id.toString() === req.user._id.toString());

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: This operation belongs to a facility outside your assigned warehouse scope.',
        });
      }
    }

    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Stock Operation (Receipt / Delivery / Internal / Adjustment)
// @route   POST /api/operations
exports.createOperation = async (req, res, next) => {
  try {
    const { type, partner, sourceLocation, destLocation, items, notes, warehouseId } = req.body;

    if (!type || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide operation type and at least one item line',
      });
    }

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

    const prefixMap = {
      RECEIPT: 'REC',
      DELIVERY: 'DEL',
      INTERNAL: 'INT',
      ADJUSTMENT: 'ADJ',
    };
    const prefix = prefixMap[type] || 'OP';
    const reference = `${prefix}-${Date.now().toString().slice(-6)}`;

    // Infer warehouse
    let assignedWarehouse = warehouseId;
    if (!assignedWarehouse) {
      const sLoc = await Location.findById(srcLoc);
      const dLoc = await Location.findById(dstLoc);
      assignedWarehouse = (sLoc && sLoc.warehouse) || (dLoc && dLoc.warehouse) || null;
    }

    const operation = await StockOperation.create({
      reference,
      type,
      status: 'READY',
      warehouse: assignedWarehouse,
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

// @desc    Submit Stock Operation for Manager Approval (Physical execution recorded by Staff)
// @route   POST /api/operations/:id/submit
exports.submitOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'COMPLETED' || operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Operation is already completed' });
    }

    if (operation.status === 'AWAITING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Operation is already awaiting Manager approval' });
    }

    // Optional updates from body (e.g. doneQty, notes, stage)
    if (req.body.items && Array.isArray(req.body.items)) {
      for (const updateItem of req.body.items) {
        const item = operation.items.find(
          (i) => i.product.toString() === (updateItem.product._id || updateItem.product).toString()
        );
        if (item) {
          if (updateItem.doneQty !== undefined) item.doneQty = Number(updateItem.doneQty);
        }
      }
    }

    if (req.body.stage) {
      operation.stage = req.body.stage;
    }

    if (req.body.notes) {
      operation.notes = req.body.notes;
    }

    operation.status = 'AWAITING_APPROVAL';
    operation.submittedBy = req.user ? req.user._id : null;
    operation.submittedAt = new Date();

    await operation.save();

    res.status(200).json({
      success: true,
      message: `${operation.type} operation submitted for Manager approval. Official inventory remains unchanged until approval.`,
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Stock Operation (Inventory Manager ONLY: Mutates Official Inventory & writes to Stock Ledger)
// @route   POST /api/operations/:id/approve
exports.approveOperation = async (req, res, next) => {
  try {
    // 1. Enforce Role Authority
    if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Authority denied: Only an Inventory Manager can approve operations and mutate official inventory.',
      });
    }

    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'COMPLETED' || operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Operation is already completed' });
    }

    if (operation.status === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Cannot approve an operation that has been rejected' });
    }

    const sourceLoc = await Location.findById(operation.sourceLocation);
    const destLoc = await Location.findById(operation.destLocation);

    if (!sourceLoc || !destLoc) {
      return res.status(400).json({ success: false, message: 'Source or destination location missing' });
    }

    // 2. Stock Availability Check: Decrementing from internal store requires sufficient stock
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

    // 3. Apply Official Stock Movements & Audit in Stock Ledger
    for (let item of operation.items) {
      const moveQty = item.doneQty > 0 ? item.doneQty : item.demandQty;
      item.doneQty = moveQty;

      // Decrement source if INTERNAL
      if (sourceLoc.type === 'INTERNAL') {
        await updateStockQuant(item.product, sourceLoc._id, -moveQty);
      }

      // Increment destination if INTERNAL
      if (destLoc.type === 'INTERNAL') {
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
        notes: `${operation.type} approved by Manager ${req.user.name}`,
      });
    }

    operation.status = 'COMPLETED';
    operation.approvedBy = req.user._id;
    operation.approvedAt = new Date();
    operation.validatedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: `${operation.type} operation approved by Manager. Official inventory updated and recorded in Stock Ledger.`,
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject Stock Operation (Inventory Manager ONLY: Leaves inventory unchanged, records rejection reason)
// @route   POST /api/operations/:id/reject
exports.rejectOperation = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Authority denied: Only an Inventory Manager can reject operations.',
      });
    }

    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'COMPLETED' || operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already completed operation' });
    }

    operation.status = 'REJECTED';
    operation.rejectionReason = req.body.reason || req.body.rejectionReason || 'Rejected by Inventory Manager';
    operation.rejectedBy = req.user._id;
    operation.rejectedAt = new Date();
    await operation.save();

    res.status(200).json({
      success: true,
      message: `${operation.type} operation rejected. Official inventory remains unchanged.`,
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate Operation (Backward compatibility / Manager direct validation)
// @route   POST /api/operations/:id/validate
exports.validateOperation = async (req, res, next) => {
  try {
    // RBAC Check: Staff CANNOT directly finalize inventory mutations!
    if (!req.user || req.user.role !== 'INVENTORY_MANAGER') {
      return res.status(403).json({
        success: false,
        message: 'Staff cannot directly finalize inventory-changing transactions. Please submit operation for Manager approval.',
      });
    }

    // Call approveOperation logic
    return exports.approveOperation(req, res, next);
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
    if (operation.status === 'COMPLETED' || operation.status === 'DONE') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed operation' });
    }
    operation.status = 'CANCELED';
    await operation.save();
    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};
