const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockLedger = require('../models/StockLedger');
const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');

// @desc    Get all products with dynamic filters, search, and stock counts
// @route   GET /api/products
const getProducts = async (req, res, next) => {
    try {
        const { search, category, warehouse, location, status, page = 1, limit = 20 } = req.query;

        const query = { active: true };

        // SKU / Product Name Search (Section 28)
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: searchRegex },
                { sku: searchRegex },
                { description: searchRegex }
            ];
        }

        // Category Filter (Section 27)
        if (category && category !== 'all') {
            query.categoryId = category;
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        // Fetch products matching core filters
        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .populate('categoryId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            Product.countDocuments(query)
        ]);

        const productIds = products.map(p => p._id);

        // Build Inventory filter
        const invFilter = { productId: { $in: productIds } };
        if (warehouse && warehouse !== 'all') {
            invFilter.warehouseId = warehouse;
        }
        if (location && location !== 'all') {
            invFilter.locationId = location;
        }

        // Aggregate stock availability
        const stockAgg = await Inventory.aggregate([
            { $match: invFilter },
            {
                $group: {
                    _id: '$productId',
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);

        const stockMap = {};
        stockAgg.forEach(item => {
            stockMap[item._id.toString()] = item.totalQuantity;
        });

        // Compute stock state for each product
        let enrichedProducts = products.map(p => {
            const totalStock = stockMap[p._id.toString()] || 0;
            let stockStatus = 'in_stock';
            if (totalStock === 0) {
                stockStatus = 'out_of_stock';
            } else if (totalStock <= (p.reorderLevel || 10)) {
                stockStatus = 'low_stock';
            }

            return {
                ...p.toObject(),
                totalStock,
                stockStatus
            };
        });

        // Optional status filter
        if (status && status !== 'all') {
            enrichedProducts = enrichedProducts.filter(p => p.stockStatus === status);
        }

        res.json({
            success: true,
            count: enrichedProducts.length,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: enrichedProducts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product with inventory breakdown
// @route   GET /api/products/:id
const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name description');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        // Get inventory breakdown across warehouses & locations
        const inventories = await Inventory.find({ productId: product._id })
            .populate('warehouseId', 'name code')
            .populate('locationId', 'name code');

        const totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);

        let stockStatus = 'in_stock';
        if (totalStock === 0) {
            stockStatus = 'out_of_stock';
        } else if (totalStock <= product.reorderLevel) {
            stockStatus = 'low_stock';
        }

        res.json({
            success: true,
            data: {
                ...product.toObject(),
                totalStock,
                stockStatus,
                inventories
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product (with optional initial stock + ledger entry)
// @route   POST /api/products
const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            sku,
            categoryId,
            unitOfMeasure,
            description,
            reorderLevel,
            reorderQuantity,
            initialStock,
            warehouseId,
            locationId
        } = req.body;

        if (!name || !sku || !categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Name, SKU, and Category are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Validate SKU uniqueness
        const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Product with SKU '${sku.toUpperCase()}' already exists`,
                code: 'DUPLICATE_SKU'
            });
        }

        const product = await Product.create({
            name: name.trim(),
            sku: sku.trim().toUpperCase(),
            categoryId,
            unitOfMeasure: unitOfMeasure ? unitOfMeasure.trim() : 'Units',
            description: description ? description.trim() : '',
            reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 10,
            reorderQuantity: reorderQuantity !== undefined ? Number(reorderQuantity) : 50
        });

        let initialStockCreated = 0;

        // If Initial Stock > 0, create Inventory Record and Ledger Entry (Section 31)
        if (initialStock && Number(initialStock) > 0) {
            const initQty = Number(initialStock);
            let targetWarehouseId = warehouseId;
            let targetLocationId = locationId;

            // Fallback to first warehouse & location if not explicitly provided
            if (!targetWarehouseId || !targetLocationId) {
                const defaultWh = await Warehouse.findOne({ active: true });
                if (defaultWh) {
                    targetWarehouseId = defaultWh._id;
                    const defaultLoc = await Location.findOne({ warehouseId: defaultWh._id, active: true });
                    if (defaultLoc) {
                        targetLocationId = defaultLoc._id;
                    }
                }
            }

            if (targetWarehouseId && targetLocationId) {
                await Inventory.findOneAndUpdate(
                    {
                        productId: product._id,
                        warehouseId: targetWarehouseId,
                        locationId: targetLocationId
                    },
                    { $set: { quantity: initQty } },
                    { upsert: true, new: true }
                );

                await StockLedger.create({
                    productId: product._id,
                    warehouseId: targetWarehouseId,
                    locationId: targetLocationId,
                    operationType: 'INITIAL_STOCK',
                    referenceId: product._id,
                    referenceNumber: `INIT-${product.sku}`,
                    quantityBefore: 0,
                    quantityChange: initQty,
                    quantityAfter: initQty,
                    createdBy: req.user ? req.user._id : null,
                    createdByName: req.user ? req.user.name : 'System Initializer'
                });

                initialStockCreated = initQty;
            }
        }

        res.status(201).json({
            success: true,
            data: {
                ...product.toObject(),
                totalStock: initialStockCreated,
                stockStatus: initialStockCreated === 0 ? 'out_of_stock' : (initialStockCreated <= product.reorderLevel ? 'low_stock' : 'in_stock')
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
    try {
        const {
            name,
            sku,
            categoryId,
            unitOfMeasure,
            description,
            reorderLevel,
            reorderQuantity,
            active
        } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        if (sku && sku.trim().toUpperCase() !== product.sku) {
            const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `SKU '${sku.toUpperCase()}' is already in use`,
                    code: 'DUPLICATE_SKU'
                });
            }
            product.sku = sku.trim().toUpperCase();
        }

        if (name) product.name = name.trim();
        if (categoryId) product.categoryId = categoryId;
        if (unitOfMeasure) product.unitOfMeasure = unitOfMeasure.trim();
        if (description !== undefined) product.description = description.trim();
        if (reorderLevel !== undefined) product.reorderLevel = Number(reorderLevel);
        if (reorderQuantity !== undefined) product.reorderQuantity = Number(reorderQuantity);
        if (active !== undefined) product.active = active;

        await product.save();

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
                code: 'PRODUCT_NOT_FOUND'
            });
        }

        // Check if there is active stock
        const totalStock = await Inventory.aggregate([
            { $match: { productId: product._id } },
            { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);

        if (totalStock.length > 0 && totalStock[0].total > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete product with existing stock (${totalStock[0].total} units)`,
                code: 'PRODUCT_HAS_STOCK'
            });
        }

        // Soft delete / archive product
        product.active = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product archived successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
