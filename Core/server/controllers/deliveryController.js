const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const StockLedger = require('../models/StockLedger');
const Product = require('../models/Product');

// Helper to generate unique delivery number: DEL-YYYYMMDD-XXXX
const generateDeliveryNumber = async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Delivery.countDocuments({
        deliveryNumber: new RegExp(`^DEL-${today}`)
    });
    const seq = String(count + 1).padStart(4, '0');
    return `DEL-${today}-${seq}`;
};

// @desc    Get all deliveries with filters and pagination
// @route   GET /api/deliveries
const getDeliveries = async (req, res, next) => {
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
                { deliveryNumber: regex },
                { customer: regex }
            ];
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [deliveries, totalCount] = await Promise.all([
            Delivery.find(query)
                .populate('warehouseId', 'name code')
                .populate('locationId', 'name code')
                .populate('items.productId', 'name sku unitOfMeasure')
                .populate('createdBy', 'name')
                .populate('validatedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            Delivery.countDocuments(query)
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: deliveries
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single delivery by ID
// @route   GET /api/deliveries/:id
const getDeliveryById = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('warehouseId', 'name code address')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku unitOfMeasure')
            .populate('createdBy', 'name email')
            .populate('validatedBy', 'name email');

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                code: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create delivery
// @route   POST /api/deliveries
const createDelivery = async (req, res, next) => {
    try {
        const { customer, warehouseId, locationId, items, shippingAddress, status = 'Draft' } = req.body;

        if (!customer || !warehouseId || !locationId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer, warehouseId, locationId, and at least one item are required',
                code: 'VALIDATION_ERROR'
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

        const deliveryNumber = await generateDeliveryNumber();

        const delivery = await Delivery.create({
            deliveryNumber,
            customer: customer.trim(),
            warehouseId,
            locationId,
            items: items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity)
            })),
            shippingAddress: shippingAddress ? shippingAddress.trim() : '',
            status: ['Draft', 'Waiting', 'Ready'].includes(status) ? status : 'Draft',
            createdBy: req.user ? req.user._id : null
        });

        const populated = await Delivery.findById(delivery._id)
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

// @desc    Update delivery (only if not Done or Canceled)
// @route   PUT /api/deliveries/:id
const updateDelivery = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                code: 'NOT_FOUND'
            });
        }

        if (delivery.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a delivery order that has already been validated and delivered',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (delivery.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a canceled delivery',
                code: 'INVALID_STATUS'
            });
        }

        const { customer, warehouseId, locationId, items, shippingAddress, status } = req.body;

        if (customer) delivery.customer = customer.trim();
        if (warehouseId) delivery.warehouseId = warehouseId;
        if (locationId) delivery.locationId = locationId;
        if (shippingAddress !== undefined) delivery.shippingAddress = shippingAddress.trim();
        if (status && ['Draft', 'Waiting', 'Ready'].includes(status)) {
            delivery.status = status;
        }

        if (items && Array.isArray(items) && items.length > 0) {
            delivery.items = items.map(it => ({
                productId: it.productId,
                quantity: Number(it.quantity)
            }));
        }

        await delivery.save();

        const updated = await Delivery.findById(delivery._id)
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

// @desc    Validate delivery: Validates sufficient stock, decreases inventory & creates StockLedger (Section 16)
// @route   POST /api/deliveries/:id/validate
const validateDelivery = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id).populate('items.productId');

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                code: 'NOT_FOUND'
            });
        }

        if (delivery.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Delivery order is already validated and completed',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        if (delivery.status === 'Canceled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot validate a canceled delivery order',
                code: 'INVALID_STATUS'
            });
        }

        // STEP 1: Verify available stock for ALL items first (atomic verification)
        const inventoryRecords = [];
        for (const item of delivery.items) {
            const inventory = await Inventory.findOne({
                productId: item.productId._id || item.productId,
                warehouseId: delivery.warehouseId,
                locationId: delivery.locationId
            });

            const currentStock = inventory ? inventory.quantity : 0;
            const requestedQty = Number(item.quantity);

            if (currentStock < requestedQty) {
                const productName = item.productId.name || 'Product';
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for '${productName}'. Available: ${currentStock}, Requested: ${requestedQty}`,
                    code: 'INSUFFICIENT_STOCK'
                });
            }

            inventoryRecords.push({
                item,
                inventory,
                currentStock,
                requestedQty
            });
        }

        // STEP 2: Decrement inventory and write audit ledger
        for (const record of inventoryRecords) {
            const { item, inventory, currentStock, requestedQty } = record;
            const quantityAfter = currentStock - requestedQty;

            inventory.quantity = quantityAfter;
            await inventory.save();

            await StockLedger.create({
                productId: item.productId._id || item.productId,
                warehouseId: delivery.warehouseId,
                locationId: delivery.locationId,
                operationType: 'DELIVERY',
                referenceId: delivery._id,
                referenceNumber: delivery.deliveryNumber,
                quantityBefore: currentStock,
                quantityChange: -requestedQty,
                quantityAfter,
                createdBy: req.user ? req.user._id : null,
                createdByName: req.user ? req.user.name : 'Delivery Dispatcher'
            });
        }

        delivery.status = 'Done';
        delivery.validatedBy = req.user ? req.user._id : null;
        delivery.validatedAt = new Date();
        await delivery.save();

        const populated = await Delivery.findById(delivery._id)
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code')
            .populate('items.productId', 'name sku')
            .populate('validatedBy', 'name');

        res.json({
            success: true,
            message: 'Delivery order validated successfully. Stock dispatched and ledger updated.',
            data: populated
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel delivery
// @route   POST /api/deliveries/:id/cancel
const cancelDelivery = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found',
                code: 'NOT_FOUND'
            });
        }

        if (delivery.status === 'Done') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a delivery that has already been validated and shipped.',
                code: 'OPERATION_ALREADY_VALIDATED'
            });
        }

        delivery.status = 'Canceled';
        await delivery.save();

        res.json({
            success: true,
            message: 'Delivery canceled. No stock was affected.',
            data: delivery
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDelivery,
    validateDelivery,
    cancelDelivery
};
