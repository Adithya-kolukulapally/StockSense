const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    unitOfMeasure: {
        type: String,
        default: 'Units'
    }
});

const receiptSchema = new mongoose.Schema(
    {
        receiptNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        supplier: {
            type: String,
            required: [true, 'Supplier is required'],
            trim: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse is required']
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Destination location is required']
        },
        status: {
            type: String,
            enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'],
            default: 'Draft'
        },
        items: {
            type: [receiptItemSchema],
            validate: [v => Array.isArray(v) && v.length > 0, 'Receipt must have at least one item']
        },
        notes: {
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

module.exports = mongoose.model('Receipt', receiptSchema);
