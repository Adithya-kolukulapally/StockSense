const Receipt = require('../models/Receipt');
const Inventory = require('../models/Inventory');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

// Helper to generate unique receipt number: REC-YYYYMMDD-XXXX
const generateReceiptNumber = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Receipt.countDocuments({
        receiptNumber: new RegExp(`^REC-${today}`)
    });
    const seq = String(count + 1).padStart(4, '0');
    return `REC-${today}-${seq}`;
};

// @desc    Get all receipts with pagination & filtering
// @route   GET /api/receipts
const getReceipts = async (req, res, next) => {
    try {
        const { status, warehouseId, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (warehouseId && warehouseId !== 'all') {
            query.warehouseId = warehouseId;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { receiptNumber: regex },
                { supplier: regex }
            ];
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [receipts, totalCount] = await Promise.all([
            Receipt.find(query)
                .populate('warehouseId', 'name code')
                .populate('locationId', 'name code')
                .populate('items.productId', 'name sku unitOfMeasure')
                .populate('createdBy', 'name')
                .populate('validatedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            Receipt.countDocuments(query)
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: receipts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single receipt by ID
// @route   GET /api/receipts/:id
const getReceiptById = async (req, res, next) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('warehouseId', 'name code address')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku unitOfMeasure')
            .populate('createdBy', 'name email')
            .populate('validatedBy', 'name email');

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: receipt
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create receipt
// @route   POST /api/receipts
const createReceipt = async (req, res, next) => {
    try {
        const { supplier, warehouseId, locationId, items, notes, status = 'Draft' } = req.body;

        if (!supplier || !warehouseId || !locationId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Supplier, warehouseId, locationId, and at least one item are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Validate items have positive quantities
        for (const item of items) {
            if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid product and positive quantity',
                    code: 'INVALID_QUANTITY'
                });
            }
        }

        const receiptNumber = await generateReceiptNumber();

        const receipt = await Receipt.create({
            receiptNumber,
            supplier: supplier.trim(),
            warehouseId,
            locationId,
            items: items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity),
                unitOfMeasure: it.unitOfMeasure || 'Units'
            })),
            notes: notes || '',
            status: ['Draft', 'Waiting', 'Ready'].includes(status) ? status : 'Draft',
            createdBy: req.user ? req.user._id : null
        });

        const populated = await Receipt.findById(receipt._id)
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku');

        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update receipt (only if not Done or Canceled)
// @route   PUT /api/receipts/:id
const updateReceipt = async (req, res, next) => {
    try {
        const receipt = await Receipt.findById(req.params.id);
        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found',
                code: 'NOT_FOUND'
            });
        }

        if (receipt.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a receipt that has already been validated and completed',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (receipt.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a canceled receipt',
                code: 'INVALID_STATUS'
            });
        }

        const { supplier, warehouseId, locationId, items, notes, status } = req.body;

        if (supplier) receipt.supplier = supplier.trim();
        if (warehouseId) receipt.warehouseId = warehouseId;
        if (locationId) receipt.locationId = locationId;
        if (notes !== undefined) receipt.notes = notes;
        if (status && ['Draft', 'Waiting', 'Ready'].includes(status)) {
            receipt.status = status;
        }

        if (items && Array.isArray(items) && items.length > 0) {
            receipt.items = items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity),
                unitOfMeasure: it.unitOfMeasure || 'Units'
            }));
        }

        await receipt.save();

        const updated = await Receipt.findById(receipt._id)
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku');

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Validate receipt: Atomically increases inventory & creates StockLedger entries (Section 13)
// @route   POST /api/receipts/:id/validate
const validateReceipt = async (req, res, next) => {
    try {
        const receipt = await Receipt.findById(req.params.id);

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found',
                code: 'NOT_FOUND'
            });
        }

        if (receipt.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Receipt is already validated and completed',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (receipt.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot validate a canceled receipt',
                code: 'INVALID_STATUS'
            });
        }

        // Process stock increase and ledger creation for each item
        for (const item of receipt.items) {
            let inventory = await Inventory.findOne({
                productId: item.productId,
                warehouseId: receipt.warehouseId,
                locationId: receipt.locationId
            });

            const quantityBefore = inventory ? inventory.quantity : 0;
            const quantityChange = Number(item.quantity);
            const quantityAfter = quantityBefore + quantityChange;

            if (inventory) {
                inventory.quantity = quantityAfter;
                await inventory.save();
            } else {
                inventory = await Inventory.create({
                    productId: item.productId,
                    warehouseId: receipt.warehouseId,
                    locationId: receipt.locationId,
                    quantity: quantityAfter
                });
            }

            // Create audit ledger entry
            await StockLedger.create({
                productId: item.productId,
                warehouseId: receipt.warehouseId,
                locationId: receipt.locationId,
                operationType: 'RECEIPT',
                referenceId: receipt._id,
                referenceNumber: receipt.receiptNumber,
                quantityBefore,
                quantityChange,
                quantityAfter,
                createdBy: req.user ? req.user._id : null,
                createdByName: req.user ? req.user.name : 'Receipt Validator'
            });
        }

        receipt.status = 'Done';
        receipt.validatedBy = req.user ? req.user._id : null;
        receipt.validatedAt = new Date();
        await receipt.save();

        const populated = await Receipt.findById(receipt._id)
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku')
            .populate('validatedBy', 'name');

        res.json({
            success: true,
            message: 'Receipt validated successfully. Stock increased and ledger updated.',
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel receipt
// @route   POST /api/receipts/:id/cancel
const cancelReceipt = async (req, res, next) => {
    try {
        const receipt = await Receipt.findById(req.params.id);

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: 'Receipt not found',
                code: 'NOT_FOUND'
            });
        }

        if (receipt.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a receipt that has already been validated. Use a stock adjustment for corrections.',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        receipt.status = 'Canceled';
        await receipt.save();

        res.json({
            success: true,
            message: 'Receipt canceled. No stock was affected.',
            data: receipt
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getReceipts,
    getReceiptById,
    createReceipt,
    updateReceipt,
    validateReceipt,
    cancelReceipt
};
