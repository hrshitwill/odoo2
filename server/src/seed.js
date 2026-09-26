const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Location = require('./models/Location');
const Product = require('./models/Product');
const StockQuant = require('./models/StockQuant');
const StockOperation = require('./models/StockOperation');
const StockLedger = require('./models/StockLedger');

const seedData = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('[Seeder] Connected successfully!');

    // 1. Clean existing data
    console.log('[Seeder] Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Warehouse.deleteMany({}),
      Location.deleteMany({}),
      Product.deleteMany({}),
      StockQuant.deleteMany({}),
      StockOperation.deleteMany({}),
      StockLedger.deleteMany({}),
    ]);

    // 2. Seed Users
    console.log('[Seeder] Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const [managerPass, staffPass] = await Promise.all([
      bcrypt.hash('admin123', salt),
      bcrypt.hash('staff123', salt),
    ]);

    const manager = await User.create({
      name: 'Harshit (Manager)',
      email: 'manager@stocksense.com',
      password: managerPass,
      role: 'INVENTORY_MANAGER',
    });

    const staff = await User.create({
      name: 'John Staff',
      email: 'staff@stocksense.com',
      password: staffPass,
      role: 'WAREHOUSE_STAFF',
    });

    // 3. Seed Warehouse
    console.log('[Seeder] Seeding warehouse and locations...');
    const warehouse = await Warehouse.create({
      name: 'Central Warehouse',
      code: 'WH1',
      address: 'Plot 42, Logistics Park, Zone A',
    });

    // 4. Seed Locations
    const mainStore = await Location.create({
      name: 'Main Store',
      code: 'WH1/STOCK',
      warehouse: warehouse._id,
      type: 'INTERNAL',
    });

    const productionFloor = await Location.create({
      name: 'Production Floor',
      code: 'WH1/PROD',
      warehouse: warehouse._id,
      type: 'INTERNAL',
    });

    const vendorLoc = await Location.create({
      name: 'Vendors / Suppliers',
      code: 'PARTNER/VENDOR',
      type: 'VENDOR',
    });

    const customerLoc = await Location.create({
      name: 'Customers',
      code: 'PARTNER/CUSTOMER',
      type: 'CUSTOMER',
    });

    const scrapLoc = await Location.create({
      name: 'Inventory Loss / Scrap',
      code: 'VIRTUAL/SCRAP',
      type: 'INVENTORY_LOSS',
    });

    // 5. Seed Products
    console.log('[Seeder] Seeding products...');
    const [steel, frames, screws] = await Promise.all([
      Product.create({
        name: 'Steel Rods',
        sku: 'STL-ROD-01',
        category: 'Raw Materials',
        uom: 'kg',
        minStockRule: 20,
        maxStockRule: 200,
        costPrice: 45,
        description: 'High tensile steel rods for industrial framing',
      }),
      Product.create({
        name: 'Wooden Frames',
        sku: 'WOD-FRM-02',
        category: 'Finished Goods',
        uom: 'Units',
        minStockRule: 10,
        maxStockRule: 50,
        costPrice: 120,
        description: 'Pre-assembled solid wood structural frames',
      }),
      Product.create({
        name: 'Hex Screws M8',
        sku: 'SCR-HEX-03',
        category: 'Hardware',
        uom: 'pcs',
        minStockRule: 100,
        maxStockRule: 1000,
        costPrice: 1.5,
        description: 'Grade 8.8 zinc plated hex screws',
      }),
    ]);

    // 6. Seed Initial Stock Levels (StockQuants)
    console.log('[Seeder] Seeding on-hand quantities...');
    await Promise.all([
      StockQuant.create({ product: steel._id, location: mainStore._id, quantity: 100 }),
      StockQuant.create({ product: frames._id, location: mainStore._id, quantity: 25 }),
      StockQuant.create({ product: screws._id, location: mainStore._id, quantity: 500 }),
    ]);

    // 7. Seed Initial Move History in StockLedger
    console.log('[Seeder] Seeding stock ledger audit log...');
    await Promise.all([
      StockLedger.create({
        reference: 'INIT-STL-ROD-01',
        product: steel._id,
        fromLocation: vendorLoc._id,
        toLocation: mainStore._id,
        quantity: 100,
        performedBy: manager._id,
        notes: 'Initial inventory count',
      }),
      StockLedger.create({
        reference: 'INIT-WOD-FRM-02',
        product: frames._id,
        fromLocation: vendorLoc._id,
        toLocation: mainStore._id,
        quantity: 25,
        performedBy: manager._id,
        notes: 'Initial inventory count',
      }),
      StockLedger.create({
        reference: 'INIT-SCR-HEX-03',
        product: screws._id,
        fromLocation: vendorLoc._id,
        toLocation: mainStore._id,
        quantity: 500,
        performedBy: manager._id,
        notes: 'Initial inventory count',
      }),
    ]);

    // 8. Seed Sample Operations (Pending Receipt, Delivery, and Transfer)
    console.log('[Seeder] Seeding pending operations...');
    await Promise.all([
      StockOperation.create({
        reference: 'REC-100001',
        type: 'RECEIPT',
        status: 'READY',
        partner: 'Apex Steel Industries Ltd',
        sourceLocation: vendorLoc._id,
        destLocation: mainStore._id,
        items: [{ product: steel._id, demandQty: 50, doneQty: 50 }],
        createdBy: manager._id,
        notes: 'Scheduled shipment of raw steel',
      }),
      StockOperation.create({
        reference: 'DEL-200001',
        type: 'DELIVERY',
        status: 'READY',
        partner: 'Metro Interiors Corp',
        sourceLocation: mainStore._id,
        destLocation: customerLoc._id,
        items: [{ product: frames._id, demandQty: 5, doneQty: 5 }],
        createdBy: manager._id,
        notes: 'Customer order shipment #892',
      }),
      StockOperation.create({
        reference: 'INT-300001',
        type: 'INTERNAL',
        status: 'READY',
        partner: 'Internal Workshop',
        sourceLocation: mainStore._id,
        destLocation: productionFloor._id,
        items: [{ product: steel._id, demandQty: 20, doneQty: 20 }],
        createdBy: staff._id,
        notes: 'Relocating raw material to production floor',
      }),
    ]);

    console.log('----------------------------------------------------');
    console.log('✅ StockSense Database Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('Default Accounts:');
    console.log('  Manager: manager@stocksense.com  | Password: admin123');
    console.log('  Staff:   staff@stocksense.com    | Password: staff123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
};

seedData();
