const express = require('express');
const router = express.Router();
const { getLedger } = require('./ledger.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);
router.get('/', getLedger);

module.exports = router;
