const express = require('express');
const router = express.Router();
const {
    getInventory,
    getProductInventory,
    getLowStock,
    getOutOfStock
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.get('/out-of-stock', getOutOfStock);
router.get('/:productId', getProductInventory);

module.exports = router;
