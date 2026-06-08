// src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const https = require('node:https');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group');
const expenseRoutes = require('./routes/expense');
const settlementRoutes = require('./routes/settlement');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);

if (1 == 1) {
    const BACKEND_URL = `https://splitwise-zi93.onrender.com/`;

    // Ping the server every 14 minutes (840,000 ms)
    setInterval(() => {
        https.get(BACKEND_URL, (res) => {
        }).on('error', (err) => {
            console.error(`Keep-alive error: ${err.message}`);
        });
    }, 2000); // 14 minutes
    console.log(`🚀 Keep-alive active for: ${BACKEND_URL}`);
} else {
    console.log("⚠️  Not keeping server alive in non-production environment");
}
// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
