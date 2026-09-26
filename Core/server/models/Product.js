const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true
        },
        sku: {
            type: String,
            required: [true, 'SKU is required'],
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Product category is required']
        },
        unitOfMeasure: {
            type: String,
            required: [true, 'Unit of measure is required'],
            default: 'Units',
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        reorderLevel: {
            type: Number,
            default: 10,
            min: [0, 'Reorder level cannot be negative']
        },
        reorderQuantity: {
            type: Number,
            default: 50,
            min: [0, 'Reorder quantity cannot be negative']
        },
        active: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);
