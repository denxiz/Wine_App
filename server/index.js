const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

dotenv.config(); // ✅ Load .env variables


app.use(express.json());
app.use(cors());



// Database connection
const db = require('./db');

// Authentication routes
const authRoutes = require('./auth');
app.use('/auth', authRoutes);

// Other API routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});


