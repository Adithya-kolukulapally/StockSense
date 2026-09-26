const express = require('express');
const router = express.Router();
const {
    getLedger,
    getProductLedger
} = require('../controllers/ledgerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getLedger);
router.get('/:productId', getProductLedger);

module.exports = router;
