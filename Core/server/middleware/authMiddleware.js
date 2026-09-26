const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stocksense_jwt_secret_key_2026_secure');

            // Find user if available in DB
            const user = await User.findById(decoded.userId || decoded.id).select('-password');
            if (user) {
                req.user = user;
            } else {
                // If user document isn't in this DB instance yet, construct from token payload
                req.user = {
                    _id: decoded.userId || decoded.id || '660000000000000000000001',
                    name: decoded.name || 'StockSense Operator',
                    email: decoded.email || 'operator@stocksense.io',
                    role: decoded.role || 'inventory_manager'
                };
            }

            return next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired authorization token',
                code: 'INVALID_TOKEN'
            });
        }
    }

    // In development mode, allow a fallback mock user if x-dev-role header is passed, or default to inventory_manager
    if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-user']) {
        try {
            const devUser = JSON.parse(req.headers['x-dev-user']);
            req.user = {
                _id: devUser._id || '660000000000000000000001',
                name: devUser.name || 'Adithya (Manager)',
                email: devUser.email || 'adithya@stocksense.io',
                role: devUser.role || 'inventory_manager'
            };
            return next();
        } catch (e) {
            // Ignore parse error and proceed to 401
        }
    }

    return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing Bearer token in Authorization header.',
        code: 'AUTH_REQUIRED'
    });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to perform this operation`,
                code: 'FORBIDDEN'
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
