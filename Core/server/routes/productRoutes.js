const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getProducts)
    .post(authorize('inventory_manager'), createProduct);

router.route('/:id')
    .get(getProductById)
    .put(authorize('inventory_manager'), updateProduct)
    .delete(authorize('inventory_manager'), deleteProduct);

module.exports = router;
