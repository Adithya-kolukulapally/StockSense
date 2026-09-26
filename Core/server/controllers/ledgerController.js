const StockLedger = require('../models/StockLedger');

// @desc    Get Stock Ledger / Move History audit records with filters (Section 21, 36, 45)
// @route   GET /api/ledger
const getLedger = async (req, res, next) => {
    try {
        const {
            productId,
            warehouseId,
            locationId,
            operationType,
            dateFrom,
            dateTo,
            search,
            page = 1,
            limit = 25
        } = req.query;

        const query = {};

        if (productId && productId !== 'all') query.productId = productId;
        if (warehouseId && warehouseId !== 'all') query.warehouseId = warehouseId;
        if (locationId && locationId !== 'all') query.locationId = locationId;
        if (operationType && operationType !== 'all') query.operationType = operationType;

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                query.createdAt.$lte = toDate;
            }
        }

        if (search && search.trim()) {
            query.referenceNumber = new RegExp(search.trim(), 'i');
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [records, totalCount] = await Promise.all([
            StockLedger.find(query)
                .populate('productId', 'name sku unitOfMeasure')
                .populate('warehouseId', 'name code')
                .populate('locationId', 'name code')
                .populate('createdBy', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            StockLedger.countDocuments(query)
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: records
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ledger entries for a single product
// @route   GET /api/ledger/:productId
const getProductLedger = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const pageSize = parseInt(limit, 10);

        const [records, totalCount] = await Promise.all([
            StockLedger.find({ productId: req.params.productId })
                .populate('warehouseId', 'name code')
                .populate('locationId', 'name code')
                .populate('createdBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize),
            StockLedger.countDocuments({ productId: req.params.productId })
        ]);

        res.json({
            success: true,
            totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pageSize),
            data: records
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLedger,
    getProductLedger
};
