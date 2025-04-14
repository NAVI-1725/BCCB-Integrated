const express = require('express');
const router = express.Router();
const { 
  getUserSettings, 
  updateUserSettings, 
  getAdminSettings, 
  updateAdminSettings, 
  updatePassword 
} = require('../controllers/settingsController');
const { protect, protectAdmin } = require('../middleware/authMiddleware'); // Middleware to protect routes

// User settings routes (Protected)
router.get('/user', protect, getUserSettings);
router.put('/user', protect, updateUserSettings);

// User password update route (Protected)
router.put('/user/update-password', protect, updatePassword);

// Admin settings routes (Protected for admin)
router.get('/admin', protectAdmin, getAdminSettings);
router.put('/admin', protectAdmin, updateAdminSettings);

module.exports = router;
