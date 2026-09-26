const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    }
});

const internalTransferSchema = new mongoose.Schema(
    {
        transferNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        sourceWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Source warehouse is required']
        },
        sourceLocationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Source location is required']
        },
        destinationWarehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Destination warehouse is required']
        },
        destinationLocationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Destination location is required']
        },
        status: {
            type: String,
            enum: ['Draft', 'Ready', 'Done', 'Canceled'],
            default: 'Draft'
        },
        items: {
            type: [transferItemSchema],
            validate: [v => Array.isArray(v) && v.length > 0, 'Transfer must have at least one item']
        },
        reason: {
            type: String,
            default: ''
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        validatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        validatedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('InternalTransfer', internalTransferSchema);
