const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');

// @desc    Get locations (optionally filter by warehouseId)
// @route   GET /api/locations
const getLocations = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.warehouseId) {
            filter.warehouseId = req.query.warehouseId;
        }

        const locations = await Location.find(filter)
            .populate('warehouseId', 'name code')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: locations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create location
// @route   POST /api/locations
const createLocation = async (req, res, next) => {
    try {
        const { warehouseId, name, code } = req.body;
        if (!warehouseId || !name || !code) {
            return res.status(400).json({
                success: false,
                message: 'warehouseId, name, and code are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const warehouse = await Warehouse.findById(warehouseId);
        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: 'Warehouse not found',
                code: 'WAREHOUSE_NOT_FOUND'
            });
        }

        const location = await Location.create({
            warehouseId,
            name: name.trim(),
            code: code.trim().toUpperCase()
        });

        res.status(201).json({
            success: true,
            data: location
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update location
// @route   PUT /api/locations/:id
const updateLocation = async (req, res, next) => {
    try {
        const { name, code, active } = req.body;
        const location = await Location.findById(req.params.id);

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
                code: 'LOCATION_NOT_FOUND'
            });
        }

        if (name) location.name = name.trim();
        if (code) location.code = code.trim().toUpperCase();
        if (active !== undefined) location.active = active;

        await location.save();

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
const deleteLocation = async (req, res, next) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found',
                code: 'LOCATION_NOT_FOUND'
            });
        }

        // Check if there is stock in this location
        const stockCount = await Inventory.countDocuments({
            locationId: location._id,
            quantity: { $gt: 0 }
        });

        if (stockCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete location that contains active inventory items',
                code: 'LOCATION_HAS_STOCK'
            });
        }

        await Location.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation
};
