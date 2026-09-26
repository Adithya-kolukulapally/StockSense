const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        
        // Optionally attach product count per category
        const productCounts = await Product.aggregate([
            { $group: { _id: '$categoryId', count: { $sum: 1 } } }
        ]);
        const countMap = {};
        productCounts.forEach(c => {
            countMap[c._id.toString()] = c.count;
        });

        const categoriesWithCount = categories.map(cat => ({
            ...cat.toObject(),
            productCount: countMap[cat._id.toString()] || 0
        }));

        res.json({
            success: true,
            data: categoriesWithCount
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required',
                code: 'VALIDATION_ERROR'
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description ? description.trim() : ''
        });

        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                code: 'NOT_FOUND'
            });
        }

        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description.trim();

        await category.save();

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
                code: 'NOT_FOUND'
            });
        }

        const productCount = await Product.countDocuments({ categoryId: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category because it is assigned to ${productCount} product(s).`,
                code: 'CATEGORY_IN_USE'
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
