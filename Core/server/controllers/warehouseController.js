const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');

// @desc    Get all warehouses
// @route   GET /api/warehouses
const getWarehouses = async (req, res, next) => {
    try {
        const warehouses = await Warehouse.find().sort({ name: 1 });
        
        // Attach location count per warehouse
        const locationCounts = await Location.aggregate([
            { $group: { _id: '$warehouseId', count: { $sum: 1 } } }
        ]);
        const locMap = {};
        locationCounts.forEach(l => {
            locMap[l._id.toString()] = l.count;
        });

        const warehousesWithCounts = warehouses.map(w => ({
            ...w.toObject(),
            locationCount: locMap[w._id.toString()] || 0
        }));

        res.json({
            success: true,
            data: warehousesWithCounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create warehouse
// @route   POST /api/warehouses
const createWarehouse = async (req, res, next) => {
    try {
        const { name, code, address } = req.body;
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Warehouse name and code are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const warehouse = await Warehouse.create({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            address: address ? address.trim() : ''
        });

        // Auto-create a default general storage location for new warehouse
        await Location.create({
            warehouseId: warehouse._id,
            name: 'General Storage',
            code: 'GEN'
        });

        res.status(201).json({
            success: true,
            data: warehouse
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
const updateWarehouse = async (req, res, next) => {
    try {
        const { name, code, address, active } = req.body;
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found',
                code: 'WAREHOUSE_NOT_FOUND'
            });
        }

        if (name) warehouse.name = name.trim();
        if (code) warehouse.code = code.trim().toUpperCase();
        if (address !== undefined) warehouse.address = address.trim();
        if (active !== undefined) warehouse.active = active;

        await warehouse.save();

        res.json({
            success: true,
            data: warehouse
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found',
                code: 'WAREHOUSE_NOT_FOUND'
            });
        }

        // Check if there is existing stock in this warehouse
        const stockCount = await Inventory.countDocuments({
            warehouseId: warehouse._id,
            quantity: { $gt: 0 }
        });

        if (stockCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete warehouse that contains active stock inventory',
                code: 'WAREHOUSE_HAS_STOCK'
            });
        }

        await Location.deleteMany({ warehouseId: warehouse._id });
        await Warehouse.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Warehouse and associated locations deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
};
