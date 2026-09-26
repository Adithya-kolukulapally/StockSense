const crypto = require('crypto');

const generateOTP = () => {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
};

module.exports = generateOTP;
