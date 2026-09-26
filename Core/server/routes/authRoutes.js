const express = require('express');
const router = express.Router();
const {
    signup,
    login,
    getCurrentUser,
    sendOTP,
    verifyOTP,
    resetPassword,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/logout', logout);

module.exports = router;

