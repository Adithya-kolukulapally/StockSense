const InternalTransfer = require('../models/InternalTransfer');
const Inventory = require('../models/Inventory');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');

// Helper to generate unique transfer number: TR-YYYYMMDD-XXXX
const generateTransferNumber = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await InternalTransfer.countDocuments({
        transferNumber: new RegExp(`^TR-${today}`)
    });
    const seq = String(count + 1).padStart(4, '0');
    return `TR-${today}-${seq}`;
};

// @desc    Get all transfers with filters and pagination
// @route   GET /api/transfers
const getTransfers = async (req, res, next) => {
    try {
        const { status, sourceWarehouseId, destinationWarehouseId, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (sourceWarehouseId && sourceWarehouseId !== 'all') {
            query.sourceWarehouseId = sourceWarehouseId;
        }

        if (destinationWarehouseId && destinationWarehouseId !== 'all') {
            query.destinationWarehouseId = destinationWarehouseId;
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.transferNumber = regex;
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [transfers, totalCount] = await Promise.all([
            InternalTransfer.find(query)
                .populate('sourceWarehouseId', 'name code')
                .populate('sourceLocationId', 'name code')
                .populate('destinationWarehouseId', 'name code')
                .populate('destinationLocationId', 'name code')
                .populate('items.productId', 'name sku unitOfMeasure')
                .populate('createdBy', 'name')
                .populate('validatedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            InternalTransfer.countDocuments(query)
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: transfers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single transfer by ID
// @route   GET /api/transfers/:id
const getTransferById = async (req, res, next) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id)
            .populate('sourceWarehouseId', 'name code')
            .populate('sourceLocationId', 'name code')
            .populate('destinationWarehouseId', 'name code')
            .populate('destinationLocationId', 'name code')
            .populate('items.productId', 'name sku unitOfMeasure')
            .populate('createdBy', 'name email')
            .populate('validatedBy', 'name email');

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create internal transfer
// @route   POST /api/transfers
const createTransfer = async (req, res, next) => {
    try {
        const {
            sourceWarehouseId,
            sourceLocationId,
            destinationWarehouseId,
            destinationLocationId,
            items,
            reason,
            status = 'Draft'
        } = req.body;

        if (!sourceWarehouseId || !sourceLocationId || !destinationWarehouseId || !destinationLocationId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Source and destination locations, and at least one item are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Prevent identical source and destination
        if (sourceWarehouseId.toString() === destinationWarehouseId.toString() &&
            sourceLocationId.toString() === destinationLocationId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Source location and destination location cannot be identical',
                code: 'SAME_SOURCE_DESTINATION'
            });
        }

        for (const item of items) {
            if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have a valid product and positive quantity',
                    code: 'INVALID_QUANTITY'
                });
            }
        }

        const transferNumber = await generateTransferNumber();

        const transfer = await InternalTransfer.create({
            transferNumber,
            sourceWarehouseId,
            sourceLocationId,
            destinationWarehouseId,
            destinationLocationId,
            items: items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity)
            })),
            reason: reason ? reason.trim() : '',
            status: ['Draft', 'Ready'].includes(status) ? status : 'Draft',
            createdBy: req.user ? req.user._id : null
        });

        const populated = await InternalTransfer.findById(transfer._id)
            .populate('sourceWarehouseId', 'name code')
            .populate('sourceLocationId', 'name code')
            .populate('destinationWarehouseId', 'name code')
            .populate('destinationLocationId', 'name code')
            .populate('items.productId', 'name sku');

        res.status(201).json({
            success: true,
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update transfer
// @route   PUT /api/transfers/:id
const updateTransfer = async (req, res, next) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found',
                code: 'NOT_FOUND'
            });
        }

        if (transfer.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a transfer that has already been validated and completed',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (transfer.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a canceled transfer',
                code: 'INVALID_STATUS'
            });
        }

        const {
            sourceWarehouseId,
            sourceLocationId,
            destinationWarehouseId,
            destinationLocationId,
            items,
            reason,
            status
        } = req.body;

        if (sourceWarehouseId) transfer.sourceWarehouseId = sourceWarehouseId;
        if (sourceLocationId) transfer.sourceLocationId = sourceLocationId;
        if (destinationWarehouseId) transfer.destinationWarehouseId = destinationWarehouseId;
        if (destinationLocationId) transfer.destinationLocationId = destinationLocationId;
        if (reason !== undefined) transfer.reason = reason;
        if (status && ['Draft', 'Ready'].includes(status)) {
            transfer.status = status;
        }

        if (items && Array.isArray(items) && items.length > 0) {
            transfer.items = items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity)
            }));
        }

        await transfer.save();

        const updated = await InternalTransfer.findById(transfer._id)
            .populate('sourceWarehouseId', 'name code')
            .populate('sourceLocationId', 'name code')
            .populate('destinationWarehouseId', 'name code')
            .populate('destinationLocationId', 'name code')
            .populate('items.productId', 'name sku');

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Validate transfer: Atomically moves stock between locations & logs TRANSFER_OUT/TRANSFER_IN (Section 18)
// @route   POST /api/transfers/:id/validate
const validateTransfer = async (req, res, next) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id).populate('items.productId');

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found',
                code: 'NOT_FOUND'
            });
        }

        if (transfer.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Transfer is already validated and completed',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (transfer.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot validate a canceled transfer',
                code: 'INVALID_STATUS'
            });
        }

        // STEP 1: Verify source stock for ALL items
        const plan = [];
        for (const item of transfer.items) {
            const sourceInv = await Inventory.findOne({
                productId: item.productId._id || item.productId,
                warehouseId: transfer.sourceWarehouseId,
                locationId: transfer.sourceLocationId
            });

            const sourceStock = sourceInv ? sourceInv.quantity : 0;
            const transferQty = Number(item.quantity);

            if (sourceStock < transferQty) {
                const productName = item.productId.name || 'Product';
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock in source location for '${productName}'. Available: ${sourceStock}, Requested: ${transferQty}`,
                    code: 'INSUFFICIENT_STOCK'
                });
            }

            plan.push({
                item,
                sourceInv,
                sourceStock,
                transferQty
            });
        }

        // STEP 2: Execute movement and audit ledger
        for (const step of plan) {
            const { item, sourceInv, sourceStock, transferQty } = step;
            const pId = item.productId._id || item.productId;

            // Reduce source
            const sourceAfter = sourceStock - transferQty;
            sourceInv.quantity = sourceAfter;
            await sourceInv.save();

            await StockLedger.create({
                productId: pId,
                warehouseId: transfer.sourceWarehouseId,
                locationId: transfer.sourceLocationId,
                operationType: 'TRANSFER_OUT',
                referenceId: transfer._id,
                referenceNumber: transfer.transferNumber,
                quantityBefore: sourceStock,
                quantityChange: -transferQty,
                quantityAfter: sourceAfter,
                createdBy: req.user ? req.user._id : null,
                createdByName: req.user ? req.user.name : 'Transfer Operator'
            });

            // Increase destination
            let destInv = await Inventory.findOne({
                productId: pId,
                warehouseId: transfer.destinationWarehouseId,
                locationId: transfer.destinationLocationId
            });

            const destBefore = destInv ? destInv.quantity : 0;
            const destAfter = destBefore + transferQty;

            if (destInv) {
                destInv.quantity = destAfter;
                await destInv.save();
            } else {
                destInv = await Inventory.create({
                    productId: pId,
                    warehouseId: transfer.destinationWarehouseId,
                    locationId: transfer.destinationLocationId,
                    quantity: destAfter
                });
            }

            await StockLedger.create({
                productId: pId,
                warehouseId: transfer.destinationWarehouseId,
                locationId: transfer.destinationLocationId,
                operationType: 'TRANSFER_IN',
                referenceId: transfer._id,
                referenceNumber: transfer.transferNumber,
                quantityBefore: destBefore,
                quantityChange: transferQty,
                quantityAfter: destAfter,
                createdBy: req.user ? req.user._id : null,
                createdByName: req.user ? req.user.name : 'Transfer Operator'
            });
        }

        transfer.status = 'Done';
        transfer.validatedBy = req.user ? req.user._id : null;
        transfer.validatedAt = new Date();
        await transfer.save();

        const populated = await InternalTransfer.findById(transfer._id)
            .populate('sourceWarehouseId', 'name code')
            .populate('sourceLocationId', 'name code')
            .populate('destinationWarehouseId', 'name code')
            .populate('destinationLocationId', 'name code')
            .populate('items.productId', 'name sku')
            .populate('validatedBy', 'name');

        res.json({
            success: true,
            message: 'Internal transfer completed successfully. Total stock maintained.',
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel transfer
// @route   POST /api/transfers/:id/cancel
const cancelTransfer = async (req, res, next) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found',
                code: 'NOT_FOUND'
            });
        }

        if (transfer.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel an internal transfer that has already completed. Create a return transfer instead.',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        transfer.status = 'Canceled';
        await transfer.save();

        res.json({
            success: true,
            message: 'Transfer canceled. No stock was affected.',
            data: transfer
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTransfers,
    getTransferById,
    createTransfer,
    updateTransfer,
    validateTransfer,
    cancelTransfer
};
