const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product is required for ledger entry'],
            index: true
        },
        warehouseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: [true, 'Warehouse is required for ledger entry']
        },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location is required for ledger entry']
        },
        operationType: {
            type: String,
            required: true,
            enum: ['RECEIPT', 'DELIVERY', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'INITIAL_STOCK']
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId
        },
        referenceNumber: {
            type: String,
            trim: true
        },
        quantityBefore: {
            type: Number,
            required: true
        },
        quantityChange: {
            type: Number,
            required: true
        },
        quantityAfter: {
            type: Number,
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdByName: {
            type: String,
            default: 'System Operator'
        }
    },
    { timestamps: true }
);

stockLedgerSchema.index({ createdAt: -1 });
stockLedgerSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
