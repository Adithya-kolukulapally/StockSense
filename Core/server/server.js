const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const categoryRoutes = require('./routes/categoryRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const locationRoutes = require('./routes/locationRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const transferRoutes = require('./routes/transferRoutes');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

// Standard middlewares
app.use(cors());
app.use(express.json());

// Initialize MongoDB Connection
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'StockSense Core Features API',
        status: 'online',
        timestamp: new Date()
    });
});

// Mount Core API routes (Section 38 of spec)
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 StockSense Core API running on port ${PORT}`);
});

module.exports = app;
