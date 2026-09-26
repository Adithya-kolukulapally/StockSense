const express = require('express');
const router = express.Router();
const {
    getWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getWarehouses)
    .post(authorize('inventory_manager'), createWarehouse);

router.route('/:id')
    .put(authorize('inventory_manager'), updateWarehouse)
    .delete(authorize('inventory_manager'), deleteWarehouse);

module.exports = router;
