const StockQuant = require('../../models/StockQuant');
const StockLedger = require('../../models/StockLedger');
const Location = require('../../models/Location');
const Product = require('../../models/Product');

// @desc    Perform stock adjustment between physical count and recorded count
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

    // Get or create inventory loss/scrap location for balancing double-entry
    let lossLocation = await Location.findOne({ type: 'INVENTORY_LOSS' });
    if (!lossLocation) {
      lossLocation = await Location.create({
        name: 'Inventory Loss / Scrap',
        code: 'SCRAP/LOSS',
        type: 'INVENTORY_LOSS',
      });
    }

    let quant = await StockQuant.findOne({ product: productId, location: locationId });
    const recordedQty = quant ? quant.quantity : 0;
    const targetQty = Number(countedQty);
    const delta = targetQty - recordedQty; // Positive = gain, Negative = loss

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

    // From and To locations based on gain or loss
    // If loss (delta < 0): moves from physical location to inventory loss/scrap
    // If gain (delta > 0): moves from inventory loss/found to physical location
    const fromLoc = delta < 0 ? locationId : lossLocation._id;
    const toLoc = delta < 0 ? lossLocation._id : locationId;
    const adjQty = Math.abs(delta);

    const ref = `ADJ-${Date.now().toString().slice(-6)}`;

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
      },
    });
  } catch (error) {
    next(error);
  }
};
