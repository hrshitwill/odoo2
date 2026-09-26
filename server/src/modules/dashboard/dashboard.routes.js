const express = require('express');
const router = express.Router();
const { getDashboardKpis } = require('./dashboard.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/kpis', getDashboardKpis);

module.exports = router;
