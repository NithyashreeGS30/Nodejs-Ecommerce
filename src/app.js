require('dotenv').config();
const express = require('express');
require("../database/init")
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { db } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const consultationRoutes = require('./routes/consultation.routes');
const userRoutes = require('./routes/user.routes');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', consultationRoutes); // Changed this line to mount at /api root

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;