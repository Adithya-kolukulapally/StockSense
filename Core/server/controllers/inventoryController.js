const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

// @desc    Get all inventory with location & product details
// @route   GET /api/inventory
const getInventory = async (req, res, next) => {
    try {
        const { warehouseId, locationId, productId } = req.query;
        const filter = {};

        if (warehouseId) filter.warehouseId = warehouseId;
        if (locationId) filter.locationId = locationId;
        if (productId) filter.productId = productId;

        const inventory = await Inventory.find(filter)
            .populate('productId', 'name sku unitOfMeasure reorderLevel')
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory for single product
// @route   GET /api/inventory/:productId
const getProductInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory.find({ productId: req.params.productId })
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code');

        const totalStock = inventory.reduce((acc, curr) => acc + curr.quantity, 0);

        res.json({
            success: true,
            totalStock,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
// @route   GET /api/inventory/low-stock
const getLowStock = async (req, res, next) => {
    try {
        const products = await Product.find({ active: true }).populate('categoryId', 'name');
        const inventories = await Inventory.aggregate([
            { $group: { _id: '$productId', totalQuantity: { $sum: '$quantity' } } }
        ]);

        const stockMap = {};
        inventories.forEach(i => {
            stockMap[i._id.toString()] = i.totalQuantity;
        });

        const lowStockProducts = products
            .map(p => {
                const totalStock = stockMap[p._id.toString()] || 0;
                return {
                    ...p.toObject(),
                    totalStock
                };
            })
            .filter(p => p.totalStock > 0 && p.totalStock <= p.reorderLevel);

        res.json({
            success: true,
            count: lowStockProducts.length,
            data: lowStockProducts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get out-of-stock products
// @route   GET /api/inventory/out-of-stock
const getOutOfStock = async (req, res, next) => {
    try {
        const products = await Product.find({ active: true }).populate('categoryId', 'name');
        const inventories = await Inventory.aggregate([
            { $group: { _id: '$productId', totalQuantity: { $sum: '$quantity' } } }
        ]);

        const stockMap = {};
        inventories.forEach(i => {
            stockMap[i._id.toString()] = i.totalQuantity;
        });

        const outOfStockProducts = products
            .map(p => {
                const totalStock = stockMap[p._id.toString()] || 0;
                return {
                    ...p.toObject(),
                    totalStock
                };
            })
            .filter(p => p.totalStock === 0);

        res.json({
            success: true,
            count: outOfStockProducts.length,
            data: outOfStockProducts
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    getProductInventory,
    getLowStock,
    getOutOfStock
};
