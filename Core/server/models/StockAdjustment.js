const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema(
    {
        adjustmentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required']
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse is required']
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location is required']
        },
        systemQuantity: {
            type: Number,
            required: [true, 'System recorded quantity is required']
        },
        countedQuantity: {
            type: Number,
            required: [true, 'Counted physical quantity is required'],
            min: [0, 'Counted quantity cannot be negative']
        },
        difference: {
            type: Number,
            required: true
        },
        reason: {
            type: String,
            required: [true, 'Reason for adjustment is required'],
            trim: true
        },
        status: {
            type: String,
            default: 'Done'
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
