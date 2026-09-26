const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// In-memory user registry for offline/resilient storage
const registeredUsersStore = new Map();
const tempOtpStore = new Map();

// Initialize default demo users in memory
const initDemoUsers = async () => {
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('Password123!', salt);

    const demoUsers = [
        {
            id: '660000000000000000000001',
            _id: '660000000000000000000001',
            name: 'Adithya Kolukulapally',
            email: 'adithya@stocksense.io',
            password: demoPasswordHash,
            role: 'inventory_manager'
        },
        {
            id: '660000000000000000000001',
            _id: '660000000000000000000001',
            name: 'Adithya Kolukulapally',
            email: 'manager@stocksense.io',
            password: demoPasswordHash,
            role: 'inventory_manager'
        },
        {
            id: '660000000000000000000002',
            _id: '660000000000000000000002',
            name: 'Warehouse Operator',
            email: 'staff@stocksense.io',
            password: demoPasswordHash,
            role: 'warehouse_staff'
        }
    ];

    demoUsers.forEach(u => registeredUsersStore.set(u.email, u));
};
initDemoUsers();

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

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
                code: 'VALIDATION_ERROR'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. If DB connected, save to DB
        if (mongoose.connection.readyState === 1) {
            const userExists = await User.findOne({ email: normalizedEmail });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered. Please login instead.',
                    code: 'DUPLICATE_EMAIL'
                });
            }

            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                role: role || 'warehouse_staff'
            });

            // Keep in registeredUsersStore as backup
            registeredUsersStore.set(normalizedEmail, {
                id: user._id.toString(),
                _id: user._id.toString(),
                name: user.name,
                email: normalizedEmail,
                password: user.password,
                role: user.role
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
            // Offline/standalone in-memory registration
            if (registeredUsersStore.has(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered. Please login instead.',
                    code: 'DUPLICATE_EMAIL'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const fakeId = 'user_' + Date.now();

            const newUser = {
                id: fakeId,
                _id: fakeId,
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: role || 'warehouse_staff'
            };

            registeredUsersStore.set(normalizedEmail, newUser);
            const token = generateToken(fakeId, newUser.role, newUser.name, newUser.email);

            return res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: {
                    id: fakeId,
                    _id: fakeId,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
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

        // 1. Instant check for built-in demo credentials
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

        // 2. If DB is connected, check registered users in MongoDB
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

        // 3. Check in-memory registered users store
        const memoryUser = registeredUsersStore.get(normalizedEmail);
        if (memoryUser) {
            const isMatch = await bcrypt.compare(password, memoryUser.password);
            if (isMatch) {
                const token = generateToken(memoryUser.id, memoryUser.role, memoryUser.name, memoryUser.email);
                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: memoryUser.id,
                        _id: memoryUser._id,
                        name: memoryUser.name,
                        email: memoryUser.email,
                        role: memoryUser.role,
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

        // Verify OTP
        const mem = tempOtpStore.get(normalizedEmail);
        const validMemOtp = mem && (mem.otp === otp || otp === '123456') && mem.expiry > Date.now();
        const isDemo = otp === '123456';

        let userFound = false;

        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email: normalizedEmail });
            if (user && (validMemOtp || user.otp === otp || isDemo)) {
                user.password = newPassword;
                user.otp = undefined;
                user.otpExpiry = undefined;
                await user.save();
                userFound = true;
            }
        }

        const memUser = registeredUsersStore.get(normalizedEmail);
        if (memUser && (validMemOtp || isDemo)) {
            const salt = await bcrypt.genSalt(10);
            memUser.password = await bcrypt.hash(newPassword, salt);
            registeredUsersStore.set(normalizedEmail, memUser);
            userFound = true;
        }

        tempOtpStore.delete(normalizedEmail);

        if (!userFound && !validMemOtp && !isDemo) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

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
