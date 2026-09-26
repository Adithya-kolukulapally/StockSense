const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getCategories)
    .post(authorize('inventory_manager'), createCategory);

router.route('/:id')
    .put(authorize('inventory_manager'), updateCategory)
    .delete(authorize('inventory_manager'), deleteCategory);

module.exports = router;
