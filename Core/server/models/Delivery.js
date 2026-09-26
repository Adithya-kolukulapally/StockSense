const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
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

const deliverySchema = new mongoose.Schema(
    {
        deliveryNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        customer: {
            type: String,
            required: [true, 'Customer is required'],
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
            required: [true, 'Dispatch location is required']
        },
        status: {
            type: String,
            enum: ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'],
            default: 'Draft'
        },
        items: {
            type: [deliveryItemSchema],
            validate: [v => Array.isArray(v) && v.length > 0, 'Delivery must have at least one item']
        },
        shippingAddress: {
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

module.exports = mongoose.model('Delivery', deliverySchema);
