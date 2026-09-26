const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/error.middleware');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const operationRoutes = require('./modules/operations/operations.routes');
const adjustmentRoutes = require('./modules/adjustments/adjustment.routes');
const ledgerRoutes = require('./modules/ledger/ledger.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const warehouseRoutes = require('./modules/warehouse/warehouse.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'StockSense IMS API',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouses', warehouseRoutes);

// Error Handling
app.use(errorHandler);

module.exports = app;
