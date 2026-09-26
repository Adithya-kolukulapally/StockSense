const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Warehouse name is required'],
            trim: true
        },
        code: {
            type: String,
            required: [true, 'Warehouse code is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        address: {
            type: String,
            trim: true,
            default: ''
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
