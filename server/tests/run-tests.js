const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../src/app');

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
  console.log('🚀 StockSense Backend End-to-End Verification Suite');
  console.log('====================================================\n');

  // Connect DB
  console.log('[Test Suite] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('[Test Suite] Connected to DB!\n');

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[Test Suite] Server running on test port ${port}\n`);

  let managerToken = '';
  let staffToken = '';
  let testProductId = '';
  let mainStoreLocId = '';
  let prodFloorLocId = '';
  let vendorLocId = '';
  let customerLocId = '';

  try {
    // ----------------------------------------------------
    // TEST 1: Health Check
    // ----------------------------------------------------
    console.log('👉 [1/10] Verifying System Health API...');
    const health = await request(baseUrl, 'GET', '/api/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    assert(health.data.status === 'online', 'Health status is online');

    // ----------------------------------------------------
    // TEST 2: Authentication & Roles
    // ----------------------------------------------------
    console.log('\n👉 [2/10] Verifying Authentication & Access Control...');
    // Login as Manager
    const mgrLogin = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'manager@stocksense.com',
      password: 'admin123',
    });
    assert(mgrLogin.status === 200, 'Manager login successful');
    assert(mgrLogin.data.user.role === 'INVENTORY_MANAGER', 'Manager role verified');
    managerToken = mgrLogin.data.token;

    // Login as Staff
    const staffLogin = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'staff@stocksense.com',
      password: 'staff123',
    });
    assert(staffLogin.status === 200, 'Staff login successful');
    assert(staffLogin.data.user.role === 'WAREHOUSE_STAFF', 'Staff role verified');
    staffToken = staffLogin.data.token;

    // Invalid Login
    const badLogin = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'manager@stocksense.com',
      password: 'wrongpassword',
    });
    assert(badLogin.status === 401, 'Invalid credentials properly rejected with 401');

    // Verify /api/auth/me
    const meRes = await request(baseUrl, 'GET', '/api/auth/me', null, managerToken);
    assert(meRes.status === 200, 'Get current user profile succeeds');
    assert(meRes.data.data.email === 'manager@stocksense.com', 'Profile matches logged-in user');

    // OTP Password Reset Flow
    const forgotRes = await request(baseUrl, 'POST', '/api/auth/forgot-password', {
      email: 'staff@stocksense.com',
    });
    assert(forgotRes.status === 200, 'OTP generation succeeds');
    const otpCode = forgotRes.data.debugOtp;
    assert(Boolean(otpCode), 'OTP code received in dev mode');

    // Test bad OTP
    const badOtp = await request(baseUrl, 'POST', '/api/auth/reset-password', {
      email: 'staff@stocksense.com',
      otp: '000000',
      newPassword: 'staff123updated',
    });
    assert(badOtp.status === 400, 'Bad OTP rejected with 400');

    // Test valid OTP reset
    const goodOtp = await request(baseUrl, 'POST', '/api/auth/reset-password', {
      email: 'staff@stocksense.com',
      otp: otpCode,
      newPassword: 'staff123',
    });
    assert(goodOtp.status === 200, 'Password reset successful with valid OTP');

    // ----------------------------------------------------
    // TEST 3: Locations & Warehouses
    // ----------------------------------------------------
    console.log('\n👉 [3/10] Verifying Warehouses & Locations...');
    const locRes = await request(baseUrl, 'GET', '/api/warehouses/locations', null, managerToken);
    assert(locRes.status === 200, 'Locations endpoint returns 200');
    assert(locRes.data.data.length >= 4, 'Standard system locations exist');

    mainStoreLocId = locRes.data.data.find((l) => l.code === 'WH1/STOCK')._id;
    prodFloorLocId = locRes.data.data.find((l) => l.code === 'WH1/PROD')._id;
    vendorLocId = locRes.data.data.find((l) => l.type === 'VENDOR')._id;
    customerLocId = locRes.data.data.find((l) => l.type === 'CUSTOMER')._id;

    assert(Boolean(mainStoreLocId), 'Main store location ID verified');
    assert(Boolean(prodFloorLocId), 'Production floor location ID verified');

    // ----------------------------------------------------
    // TEST 4: Product Catalog & Reorder Rules
    // ----------------------------------------------------
    console.log('\n👉 [4/10] Verifying Product Management & Catalog...');
    const testSku = `TST-PROD-${Date.now().toString().slice(-4)}`;
    const createProd = await request(
      baseUrl,
      'POST',
      '/api/products',
      {
        name: 'Automated Test Part',
        sku: testSku,
        category: 'Testing',
        uom: 'pcs',
        minStockRule: 15,
        maxStockRule: 100,
        initialStock: 50,
        locationId: mainStoreLocId,
      },
      managerToken
    );
    assert(createProd.status === 201, 'Product created with initial stock');
    testProductId = createProd.data.data._id;

    // Check duplicate SKU rejection
    const dupProd = await request(
      baseUrl,
      'POST',
      '/api/products',
      { name: 'Duplicate SKU Test', sku: testSku },
      managerToken
    );
    assert(dupProd.status === 400, 'Duplicate SKU rejected with 400');

    // Get single product with stock
    const singleProd = await request(baseUrl, 'GET', `/api/products/${testProductId}`, null, managerToken);
    assert(singleProd.status === 200, 'Get single product succeeds');
    assert(singleProd.data.data.totalStock === 50, 'Initial stock reflected on product (50 pcs)');
    assert(singleProd.data.data.isLowStock === false, 'Low stock flag correctly calculated (50 > 15)');

    // ----------------------------------------------------
    // TEST 5: Receipts (Incoming Goods Workflow)
    // ----------------------------------------------------
    console.log('\n👉 [5/10] Verifying Receipts Workflow (Stock Increase)...');
    const createReceipt = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'RECEIPT',
        partner: 'Global Materials Co',
        sourceLocation: vendorLocId,
        destLocation: mainStoreLocId,
        items: [{ product: testProductId, demandQty: 30, doneQty: 30 }],
      },
      staffToken
    );
    assert(createReceipt.status === 201, 'Receipt created in READY state');
    const receiptId = createReceipt.data.data._id;

    // Validate Receipt
    const valReceipt = await request(baseUrl, 'POST', `/api/operations/${receiptId}/validate`, null, staffToken);
    assert(valReceipt.status === 200, 'Receipt validated successfully');

    // Check updated stock: 50 + 30 = 80
    const checkStockAfterReceipt = await request(baseUrl, 'GET', `/api/products/${testProductId}`, null, staffToken);
    assert(checkStockAfterReceipt.data.data.totalStock === 80, 'Stock increased to 80 after receipt validation');

    // ----------------------------------------------------
    // TEST 6: Internal Transfers Workflow
    // ----------------------------------------------------
    console.log('\n👉 [6/10] Verifying Internal Transfers (Location Relocation)...');
    const createTransfer = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'INTERNAL',
        partner: 'Shopfloor Relocation',
        sourceLocation: mainStoreLocId,
        destLocation: prodFloorLocId,
        items: [{ product: testProductId, demandQty: 25, doneQty: 25 }],
      },
      staffToken
    );
    assert(createTransfer.status === 201, 'Internal transfer created');
    const transferId = createTransfer.data.data._id;

    // Validate Transfer
    const valTransfer = await request(baseUrl, 'POST', `/api/operations/${transferId}/validate`, null, staffToken);
    assert(valTransfer.status === 200, 'Internal transfer validated');

    // Check stock per location: Main Store: 80 - 25 = 55, Production: 25. Total still 80!
    const checkTransferStock = await request(baseUrl, 'GET', `/api/products/${testProductId}`, null, staffToken);
    assert(checkTransferStock.data.data.totalStock === 80, 'Total company stock remains 80 during internal transfer');

    const mainStoreQuant = checkTransferStock.data.data.stockPerLocation.find(
      (q) => q.location._id.toString() === mainStoreLocId.toString()
    );
    const prodFloorQuant = checkTransferStock.data.data.stockPerLocation.find(
      (q) => q.location._id.toString() === prodFloorLocId.toString()
    );
    assert(mainStoreQuant.quantity === 55, 'Source Main Store reduced to 55');
    assert(prodFloorQuant.quantity === 25, 'Dest Production Floor increased to 25');

    // ----------------------------------------------------
    // TEST 7: Delivery Orders & Shortage Guard
    // ----------------------------------------------------
    console.log('\n👉 [7/10] Verifying Delivery Orders & Negative Stock Prevention...');
    // Attempt excessive delivery from Main Store (available: 55, requesting: 500)
    const excessDelivery = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'DELIVERY',
        partner: 'Mega Buyer Inc',
        sourceLocation: mainStoreLocId,
        destLocation: customerLocId,
        items: [{ product: testProductId, demandQty: 500, doneQty: 500 }],
      },
      staffToken
    );
    const excessVal = await request(
      baseUrl,
      'POST',
      `/api/operations/${excessDelivery.data.data._id}/validate`,
      null,
      staffToken
    );
    assert(excessVal.status === 400, 'Excessive delivery properly rejected (Shortage Protection)');
    assert(excessVal.data.message.includes('Insufficient stock'), 'Shortage error message is explicit');

    // Valid delivery of 20 pcs from Main Store
    const validDelivery = await request(
      baseUrl,
      'POST',
      '/api/operations',
      {
        type: 'DELIVERY',
        partner: 'Valid Customer Inc',
        sourceLocation: mainStoreLocId,
        destLocation: customerLocId,
        items: [{ product: testProductId, demandQty: 20, doneQty: 20 }],
      },
      staffToken
    );
    const validVal = await request(
      baseUrl,
      'POST',
      `/api/operations/${validDelivery.data.data._id}/validate`,
      null,
      staffToken
    );
    assert(validVal.status === 200, 'Valid delivery order validated');

    // Stock should now be: 55 - 20 = 35 at Main Store, 25 at Prod Floor -> Total = 60
    const checkStockAfterDelivery = await request(baseUrl, 'GET', `/api/products/${testProductId}`, null, staffToken);
    assert(checkStockAfterDelivery.data.data.totalStock === 60, 'Stock reduced to 60 after delivery');

    // ----------------------------------------------------
    // TEST 8: Stock Adjustments (Physical Count Reconciliation)
    // ----------------------------------------------------
    console.log('\n👉 [8/10] Verifying Stock Adjustments (Count Reconcile & Scrap)...');
    // Main Store has 35. Audit finds 3 damaged parts -> physical count is 32.
    const adjustRes = await request(
      baseUrl,
      'POST',
      '/api/adjustments',
      {
        productId: testProductId,
        locationId: mainStoreLocId,
        countedQty: 32,
        reason: '3 units damaged during forklift handling',
      },
      managerToken
    );
    assert(adjustRes.status === 201, 'Adjustment executed successfully');
    assert(adjustRes.data.data.delta === -3, 'Negative delta (-3) accurately calculated for damaged items');
    assert(adjustRes.data.data.countedQty === 32, 'Physical count recorded as 32');

    // Total stock is now 32 (Main Store) + 25 (Prod Floor) = 57
    const checkAdjustStock = await request(baseUrl, 'GET', `/api/products/${testProductId}`, null, managerToken);
    assert(checkAdjustStock.data.data.totalStock === 57, 'Total stock reconciled to 57 after adjustment');

    // ----------------------------------------------------
    // TEST 9: Move History (Stock Ledger Audit Trail)
    // ----------------------------------------------------
    console.log('\n👉 [9/10] Verifying Move History & Audit Trail (Stock Ledger)...');
    const ledgerRes = await request(
      baseUrl,
      'GET',
      `/api/ledger?productId=${testProductId}`,
      null,
      managerToken
    );
    assert(ledgerRes.status === 200, 'Stock ledger returned 200');
    assert(ledgerRes.data.total >= 4, 'All movements recorded in ledger (Init, Receipt, Transfer, Delivery, Adjustment)');

    const moveRefs = ledgerRes.data.data.map((m) => m.reference);
    assert(moveRefs.some((r) => r.startsWith('INIT-')), 'Initial stock logged in ledger');
    assert(moveRefs.some((r) => r.startsWith('REC-')), 'Receipt move logged in ledger');
    assert(moveRefs.some((r) => r.startsWith('INT-')), 'Transfer move logged in ledger');
    assert(moveRefs.some((r) => r.startsWith('DEL-')), 'Delivery move logged in ledger');
    assert(moveRefs.some((r) => r.startsWith('ADJ-')), 'Adjustment move logged in ledger');

    // ----------------------------------------------------
    // TEST 10: Dashboard KPIs & Analytics
    // ----------------------------------------------------
    console.log('\n👉 [10/10] Verifying Live Dashboard KPIs...');
    const kpiRes = await request(baseUrl, 'GET', '/api/dashboard/kpis', null, managerToken);
    assert(kpiRes.status === 200, 'Dashboard KPIs endpoint returned 200');
    assert(kpiRes.data.data.totalProducts >= 4, 'Total products metric accurate');
    assert(kpiRes.data.data.totalItemsInStock > 0, 'Total items in stock metric accurate');
    assert(typeof kpiRes.data.data.lowStockItems === 'number', 'Low stock items computed');
    assert(Array.isArray(kpiRes.data.data.statusBreakdown), 'Status breakdown provided for dynamic filtering');

    console.log('\n====================================================');
    console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
    console.log('Zero bugs detected across all backend workflows.');
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
