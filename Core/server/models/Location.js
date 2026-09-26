const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse ID is required']
        },
        name: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true
        },
        code: {
            type: String,
            required: [true, 'Location code is required'],
            uppercase: true,
            trim: true
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

// Unique location code per warehouse
locationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
