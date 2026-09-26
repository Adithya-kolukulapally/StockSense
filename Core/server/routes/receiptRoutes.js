const express = require('express');
const router = express.Router();
const {
    getReceipts,
    getReceiptById,
    createReceipt,
    updateReceipt,
    validateReceipt,
    cancelReceipt
} = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getReceipts)
    .post(createReceipt);

router.route('/:id')
    .get(getReceiptById)
    .put(updateReceipt);

router.post('/:id/validate', validateReceipt);
router.post('/:id/cancel', cancelReceipt);

module.exports = router;
