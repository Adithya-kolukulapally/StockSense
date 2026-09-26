const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.set('bufferCommands', false);
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI is not defined in environment variables.');
        return false;
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected to: ${conn.connection.host} (${conn.connection.name})`);
        return true;
    } catch (error) {
        console.error(`⚠️ MongoDB Connection Error: ${error.message}`);
        console.error('Please configure a valid MONGO_URI in Core/server/.env (e.g. MongoDB Atlas or local MongoDB).');
        return false;
    }
};

module.exports = connectDB;
