const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser, // Import logout function
  updateUserAccount,
  activatePrimeStatus,
  resetPassword, // Existing reset password functionality
  forgotPassword, // New: Forgot password functionality
  verifyResetToken // New: Verify reset token functionality
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate Limiting Middleware for Forgot Password
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many password reset requests from this IP, please try again later.',
});

// User Registration
router.post('/register', registerUser);

// User Login
router.post('/login', loginUser);

// User Logout (protected route, if you want to ensure only logged-in users can log out)
router.post('/logout', protect, logoutUser);

// Update User Account (protected route)
router.put('/update', protect, updateUserAccount);

// Activate Prime Status (protected route)
router.post('/activate-prime', protect, activatePrimeStatus);

// Forgot Password (new functionality with rate-limiting and reCAPTCHA integration)
router.post('/forgotpassword', resetLimiter, forgotPassword);

// Verify Reset Token (new functionality)
router.get('/resetpassword/:token', verifyResetToken);

// Reset Password (new functionality to handle password reset using token)
router.post('/resetpassword/:token', resetPassword);


module.exports = router;
