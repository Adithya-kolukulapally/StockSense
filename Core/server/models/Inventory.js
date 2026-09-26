const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse ID is required'],
            index: true
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location ID is required'],
            index: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, 'Inventory quantity cannot be negative']
        }
    },
    { timestamps: true }
);

// One inventory record per product per warehouse location
inventorySchema.index({ productId: 1, warehouseId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
