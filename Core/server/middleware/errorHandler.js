const errorHandler = (err, req, res, next) => {
    console.error('Core Server Error:', err);

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Handle Mongoose duplicate key error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(400).json({
            success: false,
            message: `A record with this ${field} already exists (${err.keyValue[field]}).`,
            code: field.toUpperCase() === 'SKU' ? 'DUPLICATE_SKU' : 'DUPLICATE_RECORD'
        });
    }

    // Handle Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', '),
            code: 'VALIDATION_ERROR'
        });
    }

    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Invalid ID format: ${err.value}`,
            code: 'INVALID_ID'
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_SERVER_ERROR'
    });
};

module.exports = errorHandler;
