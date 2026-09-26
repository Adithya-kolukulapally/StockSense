const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.warn('⚠️ MONGO_URI is not defined. Authentication server running with in-memory persistence.');
        return false;
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
        console.warn('Authentication server operating in resilient in-memory mode.');
        return false;
    }
};

module.exports = connectDB;
