
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database connection
const db = require('./db');

// Authentication routes
const authRoutes = require('./auth');
app.use('/auth', authRoutes);

// New API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
