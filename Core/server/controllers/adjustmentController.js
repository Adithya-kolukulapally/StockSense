const StockAdjustment = require('../models/StockAdjustment');
const Inventory = require('../models/Inventory');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');

// Helper to generate unique adjustment number: ADJ-YYYYMMDD-XXXX
const generateAdjustmentNumber = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await StockAdjustment.countDocuments({
        adjustmentNumber: new RegExp(`^ADJ-${today}`)
    });
    const seq = String(count + 1).padStart(4, '0');
    return `ADJ-${today}-${seq}`;
};

// @desc    Get all adjustments with filters and pagination
// @route   GET /api/adjustments
const getAdjustments = async (req, res, next) => {
    try {
        const { productId, warehouseId, locationId, page = 1, limit = 20 } = req.query;
        const query = {};

        if (productId && productId !== 'all') query.productId = productId;
        if (warehouseId && warehouseId !== 'all') query.warehouseId = warehouseId;
        if (locationId && locationId !== 'all') query.locationId = locationId;

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [adjustments, totalCount] = await Promise.all([
            StockAdjustment.find(query)
                .populate('productId', 'name sku unitOfMeasure')
                .populate('warehouseId', 'name code')
                .populate('locationId', 'name code')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            StockAdjustment.countDocuments(query)
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: adjustments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single adjustment
// @route   GET /api/adjustments/:id
const getAdjustmentById = async (req, res, next) => {
    try {
        const adjustment = await StockAdjustment.findById(req.params.id)
            .populate('productId', 'name sku unitOfMeasure')
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('createdBy', 'name email');

        if (!adjustment) {
            return res.status(404).json({
                success: false,
                message: 'Stock adjustment not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: adjustment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create and execute stock adjustment (Section 19, 20)
// @route   POST /api/adjustments
const createAdjustment = async (req, res, next) => {
    try {
        const { productId, warehouseId, locationId, countedQuantity, reason } = req.body;

        if (!productId || !warehouseId || !locationId || countedQuantity === undefined || !reason) {
            return res.status(400).json({
                success: false,
                message: 'productId, warehouseId, locationId, countedQuantity, and reason are required',
                code: 'VALIDATION_ERROR'
            });
        }

        const counted = Number(countedQuantity);
        if (isNaN(counted) || counted < 0) {
            return res.status(400).json({
                success: false,
                message: 'Counted quantity must be a non-negative number',
                code: 'INVALID_QUANTITY'
            });
        }

        // Get current system recorded quantity
        let inventory = await Inventory.findOne({
            productId,
            warehouseId,
            locationId
        });

        const systemQuantity = inventory ? inventory.quantity : 0;
        const difference = counted - systemQuantity;

        if (inventory) {
            inventory.quantity = counted;
            await inventory.save();
        } else {
            inventory = await Inventory.create({
                productId,
                warehouseId,
                locationId,
                quantity: counted
            });
        }

        const adjustmentNumber = await generateAdjustmentNumber();

        const adjustment = await StockAdjustment.create({
            adjustmentNumber,
            productId,
            warehouseId,
            locationId,
            systemQuantity,
            countedQuantity: counted,
            difference,
            reason: reason.trim(),
            status: 'Done',
            createdBy: req.user ? req.user._id : null
        });

        // Audit ledger entry (Section 20)
        await StockLedger.create({
            productId,
            warehouseId,
            locationId,
            operationType: 'ADJUSTMENT',
            referenceId: adjustment._id,
            referenceNumber: adjustment.adjustmentNumber,
            quantityBefore: systemQuantity,
            quantityChange: difference,
            quantityAfter: counted,
            createdBy: req.user ? req.user._id : null,
            createdByName: req.user ? req.user.name : 'Stock Controller'
        });

        const populated = await StockAdjustment.findById(adjustment._id)
            .populate('productId', 'name sku unitOfMeasure')
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('createdBy', 'name');

        res.status(201).json({
            success: true,
            message: `Stock adjusted by ${difference >= 0 ? '+' : ''}${difference}. Physical count updated.`,
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdjustments,
    getAdjustmentById,
    createAdjustment
};
