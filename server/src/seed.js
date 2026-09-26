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
    console.log('[Seeder] Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stocksense';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
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

    // 2. Seed Warehouses
    console.log('[Seeder] Seeding warehouses and facilities...');
    const [mainHub, prodWarehouse, eastWarehouse] = await Promise.all([
      Warehouse.create({
        name: 'Main Central Hub',
        code: 'WH-MAIN',
        address: 'Terminal 4, North Logistics Corridor',
      }),
      Warehouse.create({
        name: 'Production Facility Warehouse',
        code: 'WH-PROD',
        address: 'Building 12, Advanced Manufacturing Zone',
      }),
      Warehouse.create({
        name: 'East Buffer Warehouse',
        code: 'WH-EAST',
        address: 'Pier 9, Logistics Harbor',
      }),
    ]);

    // 3. Seed Users
    console.log('[Seeder] Seeding test users (Alex Morgan & Marcus Miller)...');
    const salt = await bcrypt.genSalt(10);
    const [managerPass, staffPass] = await Promise.all([
      bcrypt.hash('admin123', salt),
      bcrypt.hash('staff123', salt),
    ]);

    const manager = await User.create({
      name: 'Alex Morgan',
      email: 'manager@stocksense.com',
      password: managerPass,
      role: 'INVENTORY_MANAGER',
      warehouse: null,
    });

    const staff = await User.create({
      name: 'Marcus Miller',
      email: 'staff@stocksense.com',
      password: staffPass,
      role: 'WAREHOUSE_STAFF',
      warehouse: mainHub._id,
    });

    // 4. Seed Locations
    console.log('[Seeder] Seeding locations...');
    const [receivingBayA, productionZoneB, heavyRackA, standardRackB, outboundStaging, prodFloor, scrapLoc, vendorLoc, customerLoc] =
      await Promise.all([
        Location.create({
          name: 'Receiving Bay A',
          code: 'WH-MAIN/REC-A',
          warehouse: mainHub._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Production Zone B',
          code: 'WH-MAIN/PROD-B',
          warehouse: mainHub._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Heavy Rack A (Raw)',
          code: 'WH-MAIN/RACK-A',
          warehouse: mainHub._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Standard Rack B (Components)',
          code: 'WH-MAIN/RACK-B',
          warehouse: mainHub._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Outbound Dispatch Bay',
          code: 'WH-MAIN/STG-01',
          warehouse: mainHub._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Assembly Floor Area',
          code: 'WH-PROD/FLR-01',
          warehouse: prodWarehouse._id,
          type: 'INTERNAL',
        }),
        Location.create({
          name: 'Inventory Loss / Scrap',
          code: 'VIRTUAL/SCRAP',
          type: 'INVENTORY_LOSS',
        }),
        Location.create({
          name: 'Apex Industrial Corp / Vendors',
          code: 'PARTNER/VENDOR',
          type: 'VENDOR',
        }),
        Location.create({
          name: 'AeroStructures Engineering / Customers',
          code: 'PARTNER/CUSTOMER',
          type: 'CUSTOMER',
        }),
      ]);

    // 5. Seed Products
    console.log('[Seeder] Seeding products...');
    const [steel, bolts, chairs] = await Promise.all([
      Product.create({
        name: 'Steel Rods',
        sku: 'STL-001',
        category: 'Raw Materials',
        uom: 'kg',
        minStockRule: 50,
        maxStockRule: 300,
        costPrice: 4.25,
        description: 'High tensile carbon steel rods (Grade 40 Industrial)',
      }),
      Product.create({
        name: 'Industrial Bolts',
        sku: 'BLT-M8',
        category: 'Fasteners & Hardware',
        uom: 'units',
        minStockRule: 500,
        maxStockRule: 2500,
        costPrice: 0.35,
        description: 'Grade 8.8 zinc plated hex screws M8x40mm',
      }),
      Product.create({
        name: 'Ergonomic Executive Task Chairs',
        sku: 'CHR-ERG',
        category: 'Finished Goods',
        uom: 'units',
        minStockRule: 15,
        maxStockRule: 100,
        costPrice: 85.0,
        description: 'Commercial ergonomic office task chairs with lumbar reinforcement',
      }),
    ]);

    // 6. Seed Initial Stock Levels (StockQuants)
    console.log('[Seeder] Seeding on-hand quantities (Steel Rods = 42 kg, Industrial Bolts = 100)...');
    await Promise.all([
      StockQuant.create({ product: steel._id, location: heavyRackA._id, quantity: 42 }),
      StockQuant.create({ product: bolts._id, location: standardRackB._id, quantity: 100 }),
      StockQuant.create({ product: chairs._id, location: outboundStaging._id, quantity: 28 }),
    ]);

    // 7. Seed Initial Stock Ledger Audit Trail
    console.log('[Seeder] Seeding stock ledger audit trail...');
    await Promise.all([
      StockLedger.create({
        reference: 'INIT-STL-001',
        product: steel._id,
        fromLocation: vendorLoc._id,
        toLocation: heavyRackA._id,
        quantity: 42,
        performedBy: manager._id,
        notes: 'Initial inventory baseline count',
      }),
      StockLedger.create({
        reference: 'INIT-BLT-M8',
        product: bolts._id,
        fromLocation: vendorLoc._id,
        toLocation: standardRackB._id,
        quantity: 100,
        performedBy: manager._id,
        notes: 'Initial inventory baseline count',
      }),
    ]);

    // 8. Seed Operations matching the prompt specifications
    console.log('[Seeder] Seeding sample operations (REC-1042, DEL-1048, TRF-018, ADJ-019)...');
    await Promise.all([
      // Receipt REC-1042: Ready for Staff Confirm Physical Intake
      StockOperation.create({
        reference: 'REC-1042',
        type: 'RECEIPT',
        status: 'READY',
        warehouse: mainHub._id,
        partner: 'Apex Industrial Corp',
        sourceLocation: vendorLoc._id,
        destLocation: receivingBayA._id,
        items: [{ product: steel._id, demandQty: 100, doneQty: 100 }],
        createdBy: manager._id,
        notes: 'Inbound shipment #BL-8921: Apex Industrial Corp',
      }),
      // Delivery DEL-1048: Ready for Staff Pick & Pack
      StockOperation.create({
        reference: 'DEL-1048',
        type: 'DELIVERY',
        status: 'READY',
        warehouse: mainHub._id,
        partner: 'AeroStructures Engineering',
        sourceLocation: heavyRackA._id,
        destLocation: customerLoc._id,
        items: [{ product: steel._id, demandQty: 10, doneQty: 10 }],
        stage: 'pack',
        createdBy: manager._id,
        notes: 'Priority dispatch order for AeroStructures Engineering',
      }),
      // Transfer TRF-018: Receiving Bay A -> Production Zone B
      StockOperation.create({
        reference: 'TRF-018',
        type: 'INTERNAL',
        status: 'READY',
        warehouse: mainHub._id,
        partner: 'Internal Workshop',
        sourceLocation: receivingBayA._id,
        destLocation: productionZoneB._id,
        items: [{ product: steel._id, demandQty: 25, doneQty: 25 }],
        createdBy: manager._id,
        notes: 'Relocating raw material to Production Zone B',
      }),
      // Adjustment ADJ-019: Marcus Miller submitted physical count (-3 damaged) -> AWAITING APPROVAL
      StockOperation.create({
        reference: 'ADJ-019',
        type: 'ADJUSTMENT',
        status: 'AWAITING_APPROVAL',
        warehouse: mainHub._id,
        partner: 'Cycle Audit',
        sourceLocation: standardRackB._id,
        destLocation: scrapLoc._id,
        items: [{ product: bolts._id, demandQty: 3, doneQty: 3 }],
        systemQty: 100,
        countedQty: 97,
        difference: -3,
        adjustmentReason: 'Damaged',
        submittedBy: staff._id,
        submittedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
        createdBy: staff._id,
        notes: 'Forklift impact damaged bottom carton: 3 bolts broken',
      }),
    ]);

    console.log('----------------------------------------------------');
    console.log('✅ StockSense Database Seeded Successfully!');
    console.log('----------------------------------------------------');
    console.log('Default Accounts:');
    console.log('  Manager: Alex Morgan   | email: manager@stocksense.com | Password: admin123');
    console.log('  Staff:   Marcus Miller | email: staff@stocksense.com   | Password: staff123');
    console.log('  Assigned Warehouse: Main Central Hub');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    process.exit(1);
  }
};

seedData();
