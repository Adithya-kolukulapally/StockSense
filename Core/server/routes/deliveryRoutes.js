const express = require('express');
const router = express.Router();
const {
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    validateDelivery,
    cancelDelivery
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getDeliveries)
    .post(createDelivery);

router.route('/:id')
    .get(getDeliveryById)
    .put(updateDelivery);

router.post('/:id/validate', validateDelivery);
router.post('/:id/cancel', cancelDelivery);

module.exports = router;
