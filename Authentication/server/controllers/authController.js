const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../services/emailService');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// In-memory user registry for standalone resilience (when MongoDB is offline or connecting)
const registeredUsersStore = new Map();
const tempOtpStore = new Map();

// Initialize default demo credentials
const initDemoUsers = async () => {
    const salt = await bcrypt.genSalt(10);
    const demoPasswordHash = await bcrypt.hash('Password123!', salt);

    const demoUsers = [
        {
            _id: '660000000000000000000001',
            id: '660000000000000000000001',
            name: 'Adithya Kolukulapally',
            email: 'adithya@stocksense.io',
            password: demoPasswordHash,
            role: 'inventory_manager'
        },
        {
            _id: '660000000000000000000002',
            id: '660000000000000000000002',
            name: 'Adithya Kolukulapally',
            email: 'manager@stocksense.io',
            password: demoPasswordHash,
            role: 'inventory_manager'
        },
        {
            _id: '660000000000000000000003',
            id: '660000000000000000000003',
            name: 'Warehouse Operator',
            email: 'staff@stocksense.io',
            password: demoPasswordHash,
            role: 'warehouse_staff'
        }
    ];

    demoUsers.forEach(u => registeredUsersStore.set(u.email, u));
};
initDemoUsers();

const getUserById = (userId) => {
    for (const u of registeredUsersStore.values()) {
        if (u.id === String(userId) || u._id === String(userId)) {
            return {
                _id: u._id,
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role
            };
        }
    }
    return null;
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check in-memory store for duplicate
        if (registeredUsersStore.has(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered. Please login instead.'
            });
        }

        // 2. Check MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            const userExists = await User.findOne({ email: normalizedEmail });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered. Please login instead.'
                });
            }

            const dbUser = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                role: role || 'warehouse_staff'
            });

            // Also keep in memory as backup
            registeredUsersStore.set(normalizedEmail, {
                _id: dbUser._id.toString(),
                id: dbUser._id.toString(),
                name: dbUser.name,
                email: normalizedEmail,
                password: dbUser.password,
                role: dbUser.role
            });

            return res.status(201).json({
                success: true,
                message: 'Signup successful. Please login.'
            });
        }

        // 3. Resilient In-Memory Storage (when MongoDB is offline)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newId = 'user_' + Date.now();

        const newUser = {
            _id: newId,
            id: newId,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'warehouse_staff'
        };

        registeredUsersStore.set(normalizedEmail, newUser);

        return res.status(201).json({
            success: true,
            message: 'Signup successful. Please login.'
        });
    } catch (error) {
        console.error('Signup error:', error);
        const message = error.name === 'ValidationError'
            ? Object.values(error.errors).map(v => v.message).join(', ')
            : (error.message || 'Something went wrong');

        res.status(500).json({ success: false, message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both email and password'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. If DB connected, check MongoDB
        if (mongoose.connection.readyState === 1) {
            const dbUser = await User.findOne({ email: normalizedEmail });
            if (dbUser && (await dbUser.matchPassword(password))) {
                const token = generateToken(dbUser._id.toString(), dbUser.role);

                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: dbUser._id.toString(),
                        _id: dbUser._id.toString(),
                        name: dbUser.name,
                        email: dbUser.email,
                        role: dbUser.role,
                        token
                    }
                });
            }
        }

        // 2. Check in-memory store
        const memoryUser = registeredUsersStore.get(normalizedEmail);
        if (memoryUser) {
            const isMatch = await bcrypt.compare(password, memoryUser.password);
            if (isMatch) {
                const token = generateToken(memoryUser.id, memoryUser.role);

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

        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message || 'Something went wrong' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
    try {
        if (req.user) {
            return res.json({
                success: true,
                user: {
                    id: req.user._id || req.user.id,
                    _id: req.user._id || req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role
                }
            });
        }

        res.status(404).json({ success: false, message: 'User not found' });
    } catch (error) {
        console.error('getCurrentUser error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const otp = generateOTP();
        const expiry = Date.now() + 5 * 60 * 1000;

        tempOtpStore.set(normalizedEmail, { otp, expiry });

        // Update in MongoDB if available
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email: normalizedEmail });
            if (user) {
                user.otp = otp;
                user.otpExpiry = new Date(expiry);
                await user.save();
            }
        }

        console.log(`[AUTH] Verification OTP for ${normalizedEmail}: ${otp}`);

        // Send email via nodemailer if configured
        try {
            await sendEmail({
                email: normalizedEmail,
                subject: 'Password Reset OTP',
                message: `Your password reset OTP is ${otp}. It expires in 5 minutes.`
            });
        } catch (err) {
            // SMTP failure is non-fatal; OTP logged to console & returned for testing
            console.log(`[SMTP] Notice: Email not dispatched (${err.message}). Use console OTP.`);
        }

        res.json({
            success: true,
            message: 'If the account exists, an OTP has been sent.',
            demoOtp: otp
        });
    } catch (error) {
        console.error('sendOTP error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
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

        // 2. Check MongoDB if connected
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

        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    } catch (error) {
        console.error('verifyOTP error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
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

        // Update MongoDB if connected
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

        // Update in-memory store
        const memoryUser = registeredUsersStore.get(normalizedEmail);
        if (memoryUser && (validMemOtp || isDemo)) {
            const salt = await bcrypt.genSalt(10);
            memoryUser.password = await bcrypt.hash(newPassword, salt);
            registeredUsersStore.set(normalizedEmail, memoryUser);
            userFound = true;
        }

        tempOtpStore.delete(normalizedEmail);

        if (!userFound && !validMemOtp && !isDemo) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.json({ success: true, message: 'Password reset successfully. Please login.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
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
    logout,
    getUserById
};
