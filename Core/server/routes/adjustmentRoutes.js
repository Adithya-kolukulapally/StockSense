const express = require('express');
const router = express.Router();
const {
    getAdjustments,
    getAdjustmentById,
    createAdjustment
} = require('../controllers/adjustmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAdjustments)
    .post(createAdjustment);

router.route('/:id')
    .get(getAdjustmentById);

module.exports = router;
