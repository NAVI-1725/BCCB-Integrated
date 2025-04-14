const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');
const { protect } = require('./middleware/authMiddleware');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const { getChatById, getChatHistory } = require('./controllers/chatController');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../frontend')));

// Custom Content Security Policy (CSP)
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' https://code.jquery.com https://stackpath.bootstrapcdn.com https://cdn.jsdelivr.net;"
    );
    next();
});

// Remove Cross-Origin-Opener-Policy if present
app.use((req, res, next) => {
    res.removeHeader('Cross-Origin-Opener-Policy');
    next();
});

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1500 // Limit each IP to 150 requests per windowMs
});
app.use(limiter);

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Define frontend routes for EJS files
app.get('/', (req, res) => res.render('index'));
app.get('/user/login', (req, res) => res.render('users/userlogin'));
app.get('/user/register', (req, res) => res.render('users/userregister'));
app.get('/user/dashboard', protect, (req, res) => {
    const user = req.user;
    res.render('users/userdashboard', { user });
});

app.get('/user/account', protect, (req, res) => {
    const user = req.user;
    res.render('users/account', { user });
});
app.get('/user/forgotpassword', (req, res) => res.render('users/forgotpassword'));

// This route is specifically for resetting passwords and verifying the token in the URL
app.get('/user/resetpassword/:token', (req, res) => {
    const { token } = req.params;

    try {
        console.log('Verifying reset token:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully for user ID:', decoded.id);
        res.render('users/resetpassword', { token }); // Token passed for the reset form
    } catch (err) {
        console.error('Error verifying reset token:', err);
        res.status(400).render('users/error', { message: 'Invalid or expired token' });
    }
});

app.get('/user/history', protect, getChatHistory); // Fetch all chat history for the user

app.get('/user/settings', protect, (req, res) => res.render('users/settings/usersettings'));
app.get('/user/settings/general', protect, (req, res) => res.render('users/settings/general'));
app.get('/user/settings/chatbot', protect, (req, res) => res.render('users/settings/chatbot'));
app.get('/user/settings/other', protect, (req, res) => res.render('users/settings/other'));
app.get('/user/settings/security', protect, (req, res) => res.render('users/settings/security'));

// Admin routes
app.get('/admin/login', (req, res) => res.render('admin/adminlogin'));
app.get('/admin/register', (req, res) => res.render('admin/adminregister'));
app.get('/admin/uploadfile', (req, res) => res.render('admin/uploadfile'));
app.get('/admin/settings', (req, res) => res.render('admin/settings/adminsettings'));
app.get('/admin/settings/general', (req, res) => res.render('admin/settings/general'));
app.get('/admin/settings/privacy', (req, res) => res.render('admin/settings/privacy'));
app.get('/admin/settings/admin', (req, res) => res.render('admin/settings/admin'));
app.get('/admin/settings/other', (req, res) => res.render('admin/settings/other'));
app.get('/admin/settings/chatbot', (req, res) => res.render('admin/settings/chatbot'));

// API routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/settings', settingsRoutes);
app.use('/admin', adminRoutes);

// Middleware to handle unauthorized access
app.use((req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).render('unauthorized', {
            message: 'You are not authorized to view this page. Please log in again.',
        });
    }
    next();
});

// 404 Error Handler
app.use((req, res) => {
    console.log('404 error, page not found:', req.originalUrl);
    res.status(404).render('404', { title: '404 - Not Found' });
});

// Error Handler Middleware
app.use(errorHandler);

// Graceful Shutdown
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB disconnected on app termination');
        process.exit(0);
    });
});

// Database Connection
const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB:CONNECTED');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

// Connect to MongoDB
connectToDatabase();

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
