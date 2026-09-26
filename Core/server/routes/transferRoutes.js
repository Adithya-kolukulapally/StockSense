const express = require('express');
const router = express.Router();
const {
    getTransfers,
    getTransferById,
    createTransfer,
    updateTransfer,
    validateTransfer,
    cancelTransfer
} = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getTransfers)
    .post(createTransfer);

router.route('/:id')
    .get(getTransferById)
    .put(updateTransfer);

router.post('/:id/validate', validateTransfer);
router.post('/:id/cancel', cancelTransfer);

module.exports = router;
