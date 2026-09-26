const Warehouse = require('../../models/Warehouse');
const Location = require('../../models/Location');

// @desc    Get all warehouses with their locations
// @route   GET /api/warehouses
exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().lean();
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

// @desc    Get all locations
// @route   GET /api/warehouses/locations
exports.getLocations = async (req, res, next) => {
  try {
    const { type } = req.query;
    let query = {};
    if (type) query.type = type.toUpperCase();

    const locations = await Location.find(query).populate('warehouse', 'name code');
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
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
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};
