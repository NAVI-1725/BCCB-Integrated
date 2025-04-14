const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Importing required controller functions
const {
  registerAdmin,
  loginAdmin,
  getDashboard,
  viewAdmins,
  viewUsers,
  uploadFile,
  getAdminSettings,
  updateAdminSettings,
} = require('../controllers/adminController');

// Importing middleware
const { protectAdmin } = require('../middleware/authMiddleware');

// Debugging: Log imported functions to ensure they're correctly imported
// console.log({
//   registerAdmin,
//   loginAdmin,
//   getDashboard,
//   viewAdmins,
//   viewUsers,
//   uploadFile,
//   getAdminSettings,
//   updateAdminSettings,
// });

// Public routes (no authentication required)
router.post('/register', registerAdmin); // Route to register an admin
router.post('/login', loginAdmin); // Route to login an admin

// Middleware to protect routes (all routes below require authentication)
router.use(protectAdmin);

// Protected routes
router.get('/dashboard', getDashboard); // Admin dashboard with stats

// View admins and users
router.get('/viewadmins', viewAdmins); // Get list of admins
router.get('/viewusers', viewUsers); // Get list of users

// File upload route
router.post('/upload_file', uploadFile); // Upload files

// Admin settings routes
router.get('/settings', getAdminSettings); // Fetch general admin settings
router.put('/settings', updateAdminSettings); // Update general admin settings

// Specific settings types (e.g., admin, privacy, chatbot, etc.)
router.get('/settings/:type', getAdminSettings); // Fetch specific settings by type


// POST route for file upload
router.post('/uploadfile', adminController.uploadFile);

// Exporting the router
module.exports = router;
