const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const secret = process.env.JWT_SECRET || 'stocksense_jwt_secret_key_2026_secure';
            const decoded = jwt.verify(token, secret);

            // 1. If DB connected and valid ObjectId, get user from database
            if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(decoded.userId)) {
                try {
                    req.user = await User.findById(decoded.userId).select('-password -otp -otpExpiry');
                } catch (e) {
                    // ignore cast error
                }
            }

            // 2. If user not in DB or offline, check in-memory store
            if (!req.user) {
                const { getUserById } = require('../controllers/authController');
                if (typeof getUserById === 'function') {
                    req.user = getUserById(decoded.userId);
                }
                if (!req.user) {
                    req.user = {
                        _id: decoded.userId,
                        id: decoded.userId,
                        role: decoded.role || 'warehouse_staff'
                    };
                }
            }

            return next();
        } catch (error) {
            console.error('Auth protect error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Invalid or expired token.'
            });
        }
    }

    return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
    });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
