const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');

// Models for direct verification
const User = require('../src/models/User');
const Warehouse = require('../src/models/Warehouse');
const Location = require('../src/models/Location');
const Product = require('../src/models/Product');
const StockQuant = require('../src/models/StockQuant');
const StockOperation = require('../src/models/StockOperation');
const StockLedger = require('../src/models/StockLedger');

// Mini assertion library
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
};

// HTTP Request helper
const request = (baseUrl, method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('🚀 StockSense Two-Role Operational Workflow Suite');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stocksense';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('[Test Suite] Connected to DB!\n');

  // Clean and bootstrap test DB
  await Promise.all([
    User.deleteMany({}),
    Warehouse.deleteMany({}),
    Location.deleteMany({}),
    Product.deleteMany({}),
    StockQuant.deleteMany({}),
    StockOperation.deleteMany({}),
    StockLedger.deleteMany({}),
  ]);

  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  const [mgrPass, stfPass] = await Promise.all([
    bcrypt.hash('admin123', salt),
    bcrypt.hash('staff123', salt),
  ]);

  const mainHub = await Warehouse.create({
    name: 'Main Central Hub',
    code: 'WH-MAIN',
    address: 'Terminal 4, North Logistics Corridor',
  });

  const eastHub = await Warehouse.create({
    name: 'East Buffer Warehouse',
    code: 'WH-EAST',
    address: 'Pier 9',
  });

  const manager = await User.create({
    name: 'Alex Morgan',
    email: 'manager@stocksense.com',
    password: mgrPass,
    role: 'INVENTORY_MANAGER',
  });

  const staff = await User.create({
    name: 'Marcus Miller',
    email: 'staff@stocksense.com',
    password: stfPass,
    role: 'WAREHOUSE_STAFF',
    warehouse: mainHub._id,
  });

  const receivingBayA = await Location.create({
    name: 'Receiving Bay A',
    code: 'WH-MAIN/REC-A',
    warehouse: mainHub._id,
    type: 'INTERNAL',
  });

  const productionZoneB = await Location.create({
    name: 'Production Zone B',
    code: 'WH-MAIN/PROD-B',
    warehouse: mainHub._id,
    type: 'INTERNAL',
  });

  const eastStorage = await Location.create({
    name: 'East Buffer Racks',
    code: 'WH-EAST/RACK-1',
    warehouse: eastHub._id,
    type: 'INTERNAL',
  });

  const vendorLoc = await Location.create({
    name: 'Apex Industrial Corp',
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

  const steel = await Product.create({
    name: 'Steel Rods',
    sku: 'STL-001',
    category: 'Raw Materials',
    uom: 'kg',
    minStockRule: 50,
    maxStockRule: 300,
    costPrice: 4.25,
  });

  const bolts = await Product.create({
    name: 'Industrial Bolts',
    sku: 'BLT-M8',
    category: 'Fasteners & Hardware',
    uom: 'units',
    minStockRule: 100,
    maxStockRule: 1000,
    costPrice: 0.35,
  });

  // Initial stock: Steel Rods 42 kg at Main Central Hub (Receiving Bay A)
  await StockQuant.create({ product: steel._id, location: receivingBayA._id, quantity: 42 });
  // Initial stock: Industrial Bolts 100 units at Production Zone B
  await StockQuant.create({ product: bolts._id, location: productionZoneB._id, quantity: 100 });

  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Suite] Server running on test port ${port}\n`);

  let managerToken = '';
  let staffToken = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Login & Role Profiles
    // ----------------------------------------------------
    console.log('👉 [1/10] Verifying Login for Alex Morgan (Manager) and Marcus Miller (Staff)...');
    const mgrLogin = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'manager@stocksense.com',
      password: 'admin123',
    });
    assert(mgrLogin.status === 200, 'Manager Alex Morgan logs in successfully');
    assert(mgrLogin.data.user.name === 'Alex Morgan', 'Manager name matches Alex Morgan');
    assert(mgrLogin.data.user.role === 'INVENTORY_MANAGER', 'Manager role is INVENTORY_MANAGER');
    managerToken = mgrLogin.data.token;

    const staffLogin = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'staff@stocksense.com',
      password: 'staff123',
    });
    assert(staffLogin.status === 200, 'Staff Marcus Miller logs in successfully');
    assert(staffLogin.data.user.name === 'Marcus Miller', 'Staff name matches Marcus Miller');
    assert(staffLogin.data.user.role === 'WAREHOUSE_STAFF', 'Staff role is WAREHOUSE_STAFF');
    staffToken = staffLogin.data.token;

    // ----------------------------------------------------
    // TEST 2: RBAC Route & Mutation Protection
    // ----------------------------------------------------
    console.log('\n👉 [2/10] Verifying Staff Route & Inventory Mutation Protection...');
    // Staff cannot create product
    const staffCreateProduct = await request(
      baseUrl,
      'POST',
      '/api/products',
      { name: 'Unauthorized Product', sku: 'UNAUTH-01' },
      staffToken
    );
    assert(staffCreateProduct.status === 403, 'Staff prevented from creating products (403)');

    // Staff cannot access full stock ledger
    const staffLedger = await request(baseUrl, 'GET', '/api/ledger', null, staffToken);
    assert(staffLedger.status === 403, 'Staff prevented from accessing full Stock Ledger (403)');

    // Staff CAN access their own activity
    const staffActivity = await request(baseUrl, 'GET', '/api/ledger/my-activity', null, staffToken);
    assert(staffActivity.status === 200, 'Staff can access My Activity endpoint');

    // ----------------------------------------------------
    // TEST 3: Staff Warehouse Scope Enforcement
    // ----------------------------------------------------
    console.log('\n👉 [3/10] Verifying Staff Warehouse Scoping (Main Central Hub)...');
    // Staff gets warehouses -> should only see Main Central Hub
    const staffWhRes = await request(baseUrl, 'GET', '/api/warehouses', null, staffToken);
    assert(staffWhRes.status === 200, 'Staff warehouses endpoint returns 200');
    assert(staffWhRes.data.data.length === 1, 'Staff only sees assigned warehouse');
    assert(staffWhRes.data.data[0].name === 'Main Central Hub', 'Assigned warehouse is Main Central Hub');

    // Manager sees all warehouses
    const mgrWhRes = await request(baseUrl, 'GET', '/api/warehouses', null, managerToken);
    assert(mgrWhRes.data.data.length >= 2, 'Manager sees all warehouses');

    // ----------------------------------------------------
    // TEST 4: Receiving Workflow
    // Staff: Confirm Physical Intake -> AWAITING APPROVAL (Stock unchanged)
    // Manager: Approve Receipt -> COMPLETED (Stock increases + Ledger updated)
    // ----------------------------------------------------
    console.log('\n👉 [4/10] Verifying Receiving Workflow (REC-1042)...');
    // Baseline stock check: 42 kg
    const initialQuant = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    assert(initialQuant.quantity === 42, 'Baseline stock is 42 kg');

    // Create receipt document REC-1042
    const recCreate = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'RECEIPT',
        partner: 'Apex Industrial Corp',
        sourceLocation: vendorLoc._id,
        destLocation: receivingBayA._id,
        items: [{ product: steel._id, demandQty: 100, doneQty: 100 }],
        notes: 'Inbound shipment #BL-8921',
      },
      managerToken
    );
    const recId = recCreate.data.data._id;

    // Staff attempts direct validation (must be blocked)
    const staffDirectVal = await request(baseUrl, 'POST', `/api/operations/${recId}/validate`, null, staffToken);
    assert(staffDirectVal.status === 403, 'Staff direct validation is blocked (403)');

    // Staff performs physical intake and submits operation
    const staffSubmitRec = await request(
      baseUrl,
      'POST',
      `/api/operations/${recId}/submit`,
      { items: [{ product: steel._id, doneQty: 100 }] },
      staffToken
    );
    assert(staffSubmitRec.status === 200, 'Staff successfully submits physical intake');
    assert(staffSubmitRec.data.data.status === 'AWAITING_APPROVAL', 'Receipt status is now AWAITING_APPROVAL');

    // Check official stock: MUST REMAIN 42 kg!
    const quantAfterSubmit = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    assert(quantAfterSubmit.quantity === 42, 'Official inventory remains 42 kg while awaiting approval');

    // Staff attempts to approve (must be forbidden)
    const staffApprove = await request(baseUrl, 'POST', `/api/operations/${recId}/approve`, null, staffToken);
    assert(staffApprove.status === 403, 'Staff cannot approve receipt (403)');

    // Manager approves receipt
    const mgrApprove = await request(baseUrl, 'POST', `/api/operations/${recId}/approve`, null, managerToken);
    assert(mgrApprove.status === 200, 'Manager successfully approves receipt');
    assert(mgrApprove.data.data.status === 'COMPLETED', 'Receipt marked COMPLETED');

    // Check official stock: 42 + 100 = 142 kg
    const quantAfterApprove = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    assert(quantAfterApprove.quantity === 142, 'Official inventory increased to 142 kg after Manager approval');

    // Check Stock Ledger entry
    const recLedger = await StockLedger.findOne({ operation: recId });
    assert(Boolean(recLedger), 'Stock Ledger entry created upon approval');
    assert(recLedger.quantity === 100, 'Ledger quantity is 100');

    // ----------------------------------------------------
    // TEST 5: Delivery Workflow
    // Staff: Pick & Pack -> Submit Delivery -> AWAITING APPROVAL (Stock unchanged)
    // Manager: Approve Dispatch -> COMPLETED (Stock decreases)
    // ----------------------------------------------------
    console.log('\n👉 [5/10] Verifying Delivery Workflow (DEL-1048)...');
    const delCreate = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'DELIVERY',
        partner: 'AeroStructures Engineering',
        sourceLocation: receivingBayA._id,
        destLocation: customerLoc._id,
        items: [{ product: steel._id, demandQty: 10, doneQty: 10 }],
        notes: 'Priority dispatch',
      },
      managerToken
    );
    const delId = delCreate.data.data._id;

    // Staff submits delivery after picking & packing
    const staffSubmitDel = await request(
      baseUrl,
      'POST',
      `/api/operations/${delId}/submit`,
      { stage: 'pack' },
      staffToken
    );
    assert(staffSubmitDel.status === 200, 'Staff submits packed delivery for dispatch approval');
    assert(staffSubmitDel.data.data.status === 'AWAITING_APPROVAL', 'Delivery status is AWAITING_APPROVAL');

    // Stock before approval must still be 142 kg
    const quantBeforeDispatch = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    assert(quantBeforeDispatch.quantity === 142, 'Stock remains 142 kg before Manager dispatch approval');

    // Manager approves dispatch
    const mgrApproveDel = await request(baseUrl, 'POST', `/api/operations/${delId}/approve`, null, managerToken);
    assert(mgrApproveDel.status === 200, 'Manager approves dispatch');

    // Stock after approval: 142 - 10 = 132 kg
    const quantAfterDispatch = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    assert(quantAfterDispatch.quantity === 132, 'Official inventory decreased to 132 kg after dispatch approval');

    // ----------------------------------------------------
    // TEST 6: Internal Transfer Workflow
    // Receiving Bay A -> Production Zone B
    // Staff submits -> AWAITING APPROVAL -> Manager approves -> location stock moves
    // ----------------------------------------------------
    console.log('\n👉 [6/10] Verifying Internal Transfer Workflow (TRF-018)...');
    const trfCreate = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'INTERNAL',
        partner: 'Internal Workshop',
        sourceLocation: receivingBayA._id,
        destLocation: productionZoneB._id,
        items: [{ product: steel._id, demandQty: 25, doneQty: 25 }],
      },
      managerToken
    );
    const trfId = trfCreate.data.data._id;

    // Staff confirms physical movement and submits
    const staffSubmitTrf = await request(baseUrl, 'POST', `/api/operations/${trfId}/submit`, null, staffToken);
    assert(staffSubmitTrf.status === 200, 'Staff reports transfer complete and submits');
    assert(staffSubmitTrf.data.data.status === 'AWAITING_APPROVAL', 'Transfer status is AWAITING_APPROVAL');

    // Before approval: source = 132 kg, dest = 0 kg
    const srcBefore = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    const dstBefore = await StockQuant.findOne({ product: steel._id, location: productionZoneB._id });
    assert(srcBefore.quantity === 132, 'Source location stock unchanged before approval');
    assert((dstBefore ? dstBefore.quantity : 0) === 0, 'Destination location stock unchanged before approval');

    // Manager approves transfer
    const mgrApproveTrf = await request(baseUrl, 'POST', `/api/operations/${trfId}/approve`, null, managerToken);
    assert(mgrApproveTrf.status === 200, 'Manager approves internal transfer');

    // After approval: source = 132 - 25 = 107 kg, dest = 25 kg. Total = 132 kg!
    const srcAfter = await StockQuant.findOne({ product: steel._id, location: receivingBayA._id });
    const dstAfter = await StockQuant.findOne({ product: steel._id, location: productionZoneB._id });
    assert(srcAfter.quantity === 107, 'Source location decreased to 107 kg');
    assert(dstAfter.quantity === 25, 'Destination location increased to 25 kg');
    assert(srcAfter.quantity + dstAfter.quantity === 132, 'Total company stock remains 132 kg');

    // ----------------------------------------------------
    // TEST 7: Stock Adjustment (Physical Count)
    // System: 100, Physical: 97, Difference: -3
    // Staff submits count -> Manager approves -> Official inventory updates
    // ----------------------------------------------------
    console.log('\n👉 [7/10] Verifying Stock Adjustment Workflow (ADJ-019)...');
    // Staff performs count on Industrial Bolts: System = 100, Physical = 97, Diff = -3
    const staffSubmitCount = await request(
      baseUrl,
      'POST',
      '/api/adjustments',
      {
        productId: bolts._id,
        locationId: productionZoneB._id,
        countedQty: 97,
        reason: 'Damaged',
      },
      staffToken
    );
    assert(staffSubmitCount.status === 201, 'Staff submits physical count');
    assert(staffSubmitCount.data.data.status === 'AWAITING_APPROVAL', 'Adjustment status is AWAITING_APPROVAL');
    assert(staffSubmitCount.data.data.delta === -3, 'Difference is -3');
    const adjOpId = staffSubmitCount.data.data.operation._id;

    // Check official stock: MUST STILL BE 100!
    const boltQuantBefore = await StockQuant.findOne({ product: bolts._id, location: productionZoneB._id });
    assert(boltQuantBefore.quantity === 100, 'Official inventory remains 100 units before Manager approval');

    // Manager approves adjustment
    const mgrApproveAdj = await request(
      baseUrl,
      'POST',
      `/api/adjustments/${adjOpId}/approve`,
      null,
      managerToken
    );
    assert(mgrApproveAdj.status === 200, 'Manager approves stock adjustment');

    // Official stock is now 97!
    const boltQuantAfter = await StockQuant.findOne({ product: bolts._id, location: productionZoneB._id });
    assert(boltQuantAfter.quantity === 97, 'Official inventory updated to 97 units after Manager approval');

    // ----------------------------------------------------
    // TEST 8: Rejection Workflow
    // Operation rejected -> Inventory unchanged, reason & manager logged
    // ----------------------------------------------------
    console.log('\n👉 [8/10] Verifying Operation Rejection Workflow...');
    const rejectTestOp = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'RECEIPT',
        partner: 'Damaged Carrier Co',
        sourceLocation: vendorLoc._id,
        destLocation: receivingBayA._id,
        items: [{ product: steel._id, demandQty: 50, doneQty: 50 }],
      },
      managerToken
    );
    const rejOpId = rejectTestOp.data.data._id;

    // Staff submits
    await request(baseUrl, 'POST', `/api/operations/${rejOpId}/submit`, null, staffToken);

    // Manager rejects with reason
    const rejRes = await request(
      baseUrl,
      'POST',
      `/api/operations/${rejOpId}/reject`,
      { reason: 'Goods arrived water-damaged and failed intake QC' },
      managerToken
    );
    assert(rejRes.status === 200, 'Manager rejects operation');
    assert(rejRes.data.data.status === 'REJECTED', 'Status marked REJECTED');

    // Verify DB
    const rejInDb = await StockOperation.findById(rejOpId);
    assert(rejInDb.status === 'REJECTED', 'DB status is REJECTED');
    assert(rejInDb.rejectionReason.includes('water-damaged'), 'Rejection reason recorded');
    assert(Boolean(rejInDb.rejectedBy), 'Rejecting manager recorded');

    // ----------------------------------------------------
    // TEST 9: Manager Approval Queue & Staff Activity
    // ----------------------------------------------------
    console.log('\n👉 [9/10] Verifying Manager Pending Approvals Filter & Staff Activity...');
    // Create another pending operation
    const newPending = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'RECEIPT',
        partner: 'Apex Industrial Corp',
        sourceLocation: vendorLoc._id,
        destLocation: receivingBayA._id,
        items: [{ product: steel._id, demandQty: 10, doneQty: 10 }],
      },
      managerToken
    );
    await request(baseUrl, 'POST', `/api/operations/${newPending.data.data._id}/submit`, null, staffToken);

    // Manager queries pending approvals
    const pendingOpsRes = await request(
      baseUrl,
      'GET',
      '/api/operations?status=AWAITING_APPROVAL',
      null,
      managerToken
    );
    assert(pendingOpsRes.status === 200, 'Manager queries pending approvals');
    assert(pendingOpsRes.data.data.length >= 1, 'Pending operations found in Manager approval queue');

    // Staff queries My Activity
    const myAct = await request(baseUrl, 'GET', '/api/ledger/my-activity', null, staffToken);
    assert(myAct.status === 200, 'Staff retrieves My Activity');
    assert(myAct.data.data.length >= 3, 'My Activity log reflects staff submissions');
    assert(myAct.data.data[0].action !== undefined, 'Activity has action description');
    assert(myAct.data.data[0].status !== undefined, 'Activity has status');

    // ----------------------------------------------------
    // TEST 10: Dashboard KPIs & Pending Approvals Metric
    // ----------------------------------------------------
    console.log('\n👉 [10/10] Verifying Live Dashboard KPIs with Pending Approvals...');
    const kpiRes = await request(baseUrl, 'GET', '/api/dashboard/kpis', null, managerToken);
    assert(kpiRes.status === 200, 'Dashboard KPIs endpoint returned 200');
    assert(kpiRes.data.data.pendingApprovals >= 1, 'Dashboard includes pendingApprovals metric');

    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
    console.log('Two-role operational workflow verified and enforced at server level!');
    console.log('====================================================\n');

    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Execution Failed:', err.message);
    server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runAllTests();
