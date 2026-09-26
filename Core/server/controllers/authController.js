const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = (userId, role, name, email) => {
    return jwt.sign(
        { userId, role, name, email },
        process.env.JWT_SECRET || 'stocksense_jwt_secret_key_2026_secure',
        { expiresIn: '30d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/signup
const signup = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
                code: 'VALIDATION_ERROR'
            });
        }

        // If DB connected, save to DB
        if (mongoose.connection.readyState === 1) {
            const userExists = await User.findOne({ email: email.toLowerCase().trim() });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered. Please login instead.',
                    code: 'DUPLICATE_EMAIL'
                });
            }

            const user = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password,
                role: role || 'warehouse_staff'
            });

            const token = generateToken(user._id, user.role, user.name, user.email);

            return res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    token
                }
            });
        } else {
            // Offline/pending connection fallback
            const fakeId = '660000000000000000000003';
            const token = generateToken(fakeId, role || 'warehouse_staff', name, email);
            return res.status(201).json({
                success: true,
                message: 'Account registered (offline mode)',
                user: {
                    id: fakeId,
                    _id: fakeId,
                    name: name.trim(),
                    email: email.toLowerCase().trim(),
                    role: role || 'warehouse_staff',
                    token
                }
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password',
                code: 'VALIDATION_ERROR'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Instant check for built-in demo credentials (always fast, works online and offline)
        if (
            (normalizedEmail === 'adithya@stocksense.io' || normalizedEmail === 'manager@stocksense.io') &&
            password === 'Password123!'
        ) {
            const token = generateToken(
                '660000000000000000000001',
                'inventory_manager',
                'Adithya Kolukulapally',
                normalizedEmail
            );
            return res.json({
                success: true,
                message: 'Login successful as Inventory Manager',
                user: {
                    id: '660000000000000000000001',
                    _id: '660000000000000000000001',
                    name: 'Adithya Kolukulapally',
                    email: normalizedEmail,
                    role: 'inventory_manager',
                    token
                }
            });
        }

        if (normalizedEmail === 'staff@stocksense.io' && password === 'Password123!') {
            const token = generateToken(
                '660000000000000000000002',
                'warehouse_staff',
                'Warehouse Operator',
                normalizedEmail
            );
            return res.json({
                success: true,
                message: 'Login successful as Warehouse Staff',
                user: {
                    id: '660000000000000000000002',
                    _id: '660000000000000000000002',
                    name: 'Warehouse Operator',
                    email: normalizedEmail,
                    role: 'warehouse_staff',
                    token
                }
            });
        }

        // 2. If DB is connected, check registered users
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email: normalizedEmail });

            if (user && (await user.matchPassword(password))) {
                const token = generateToken(user._id, user.role, user.name, user.email);

                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user._id,
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        token
                    }
                });
            }
        }

        // If not matched or invalid password
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password. Use Password123! for demo accounts.',
            code: 'INVALID_CREDENTIALS'
        });
    } catch (error) {
        next(error);
    }
};

// In-memory OTP storage fallback when DB is connecting
const tempOtpStore = new Map();

// @desc    Send OTP for password reset
// @route   POST /api/auth/send-otp
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000;

        tempOtpStore.set(normalizedEmail, { otp, expiry });

        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email: normalizedEmail });
            if (user) {
                user.otp = otp;
                user.otpExpiry = new Date(expiry);
                await user.save();
            }
        }

        console.log(`[AUTH] Verification OTP for ${normalizedEmail}: ${otp}`);

        res.json({
            success: true,
            message: 'If the account exists, an OTP has been sent. (Demo OTP logged in server console: ' + otp + ')',
            demoOtp: otp
        });
    } catch (error) {
        console.error('sendOTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check in-memory store
        const mem = tempOtpStore.get(normalizedEmail);
        if (mem && (mem.otp === otp || otp === '123456') && mem.expiry > Date.now()) {
            return res.json({ success: true, message: 'OTP verified successfully' });
        }

        // 2. Check DB if connected
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({
                email: normalizedEmail,
                otp,
                otpExpiry: { $gt: Date.now() }
            });

            if (user || otp === '123456') {
                return res.json({ success: true, message: 'OTP verified successfully' });
            }
        }

        if (otp === '123456') {
            return res.json({ success: true, message: 'OTP verified (Demo code)' });
        }

        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    } catch (error) {
        console.error('verifyOTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email: normalizedEmail });
            if (user) {
                user.password = newPassword;
                user.otp = undefined;
                user.otpExpiry = undefined;
                await user.save();
            }
        }

        tempOtpStore.delete(normalizedEmail);

        res.json({ success: true, message: 'Password reset successfully. You can now login.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getCurrentUser = async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};

// @desc    Logout
// @route   POST /api/auth/logout
const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    signup,
    login,
    getCurrentUser,
    sendOTP,
    verifyOTP,
    resetPassword,
    logout
};

