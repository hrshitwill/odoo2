const express = require('express');
const router = express.Router();
const { getLedger, getMyActivity } = require('./ledger.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', getLedger);
router.get('/my-activity', getMyActivity);

module.exports = router;
