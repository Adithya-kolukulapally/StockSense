const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    const secret = process.env.JWT_SECRET || 'stocksense_jwt_secret_key_2026_secure';
    const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
    return jwt.sign({ userId, role }, secret, {
        expiresIn,
    });
};

module.exports = generateToken;
