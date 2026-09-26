const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database (graceful: does not exit process if Mongo is offline)
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'StockSense Authentication API',
        status: 'online',
        timestamp: new Date()
    });
});

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 StockSense Authentication Server running on port ${PORT}`);
});

module.exports = app;
