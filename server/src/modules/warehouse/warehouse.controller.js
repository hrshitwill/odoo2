const Warehouse = require('../../models/Warehouse');
const Location = require('../../models/Location');

// @desc    Get all warehouses with their locations (scoped for staff)
// @route   GET /api/warehouses
exports.getWarehouses = async (req, res, next) => {
  try {
    let whQuery = {};
    if (req.user && req.user.role === 'WAREHOUSE_STAFF' && req.user.warehouse) {
      whQuery._id = req.user.warehouse;
    }

    const warehouses = await Warehouse.find(whQuery).lean();
    const locations = await Location.find().lean();

    const data = warehouses.map((wh) => ({
      ...wh,
      locations: locations.filter((loc) => loc.warehouse && loc.warehouse.toString() === wh._id.toString()),
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all locations with optional type filter (scoped for staff)
// @route   GET /api/warehouses/locations
exports.getLocations = async (req, res, next) => {
  try {
    const { type, warehouseId } = req.query;
    let query = {};
    if (type) query.type = type.toUpperCase();
    if (warehouseId) query.warehouse = warehouseId;

    if (req.user && req.user.role === 'WAREHOUSE_STAFF' && req.user.warehouse) {
      // Allow assigned warehouse locations or external partner/virtual locations
      query.$or = [
        { warehouse: req.user.warehouse },
        { warehouse: null },
        { type: { $in: ['VENDOR', 'CUSTOMER', 'INVENTORY_LOSS'] } },
      ];
    }

    // Ensure system locations exist
    await ensureSystemLocations();

    const locations = await Location.find(query).populate('warehouse', 'name code').sort({ type: 1, name: 1 });
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, code, address } = req.body;
    const warehouse = await Warehouse.create({
      name,
      code: code.toUpperCase().trim(),
      address,
    });

    // Create default internal location for this warehouse
    await Location.create({
      name: `${warehouse.name} Stock`,
      code: `${warehouse.code}/STOCK`,
      warehouse: warehouse._id,
      type: 'INTERNAL',
    });

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// @desc    Create location
// @route   POST /api/warehouses/locations
exports.createLocation = async (req, res, next) => {
  try {
    const { name, code, warehouse, type } = req.body;
    const location = await Location.create({
      name,
      code: code.toUpperCase().trim(),
      warehouse: warehouse || null,
      type: type || 'INTERNAL',
    });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

// Helper: Ensure essential default system locations exist
const ensureSystemLocations = async () => {
  const defaults = [
    { name: 'Vendors / Suppliers', code: 'PARTNER/VENDOR', type: 'VENDOR' },
    { name: 'Customers', code: 'PARTNER/CUSTOMER', type: 'CUSTOMER' },
    { name: 'Inventory Loss / Scrap', code: 'VIRTUAL/SCRAP', type: 'INVENTORY_LOSS' },
    { name: 'Main Warehouse Stock', code: 'WH1/STOCK', type: 'INTERNAL' },
  ];

  for (let def of defaults) {
    const exists = await Location.findOne({ type: def.type, code: def.code });
    if (!exists) {
      await Location.create(def);
    }
  }
};
