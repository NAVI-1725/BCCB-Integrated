const express = require('express'); 
const { check, validationResult } = require('express-validator');
const router = express.Router();

const Chat = require('../models/chatModel');

const {
  getUserProfile,
  updateUserProfile,
  getUserChat,
  getUserSettings,
  getChatbotSettings,
  getGeneralSettings,
  getOtherSettings,
  getSecuritySettings,
  getUserAccount,  
} = require('../controllers/userController');

const {
  registerUser,
  loginUser,
  updateUserAccount,
  activatePrimeStatus,
  resetPassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Importing the User model from the correct path
const User = require('../models/userModel'); // Updated the import to use the correct path
const UserSettings = require('../models/user/usersettingsModel'); // Added missing import

// Input validation rules
const registerValidation = [
  check('name').not().isEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').exists().withMessage('Password is required'),
];

// Error handling for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User routes
router.get('/account', protect, (req, res) => {
  const user = req.user; // Assuming 'req.user' contains the user data
  const { message, error } = req.query; // Assuming you pass these as query parameters
  res.render('users/account', { user, message: message || null, error: error || null });
});

router.post('/update-account', protect, async (req, res) => {
  try {
    // Update user details
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    
    // Check if update was successful
    if (updatedUser) {
      res.redirect('/user/account?message=Your account has been updated successfully!');
    } else {
      res.redirect('/user/account?error=There was an error updating your account.');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User registration route
router.post('/register', registerValidation, handleValidationErrors, registerUser);

// User login route
router.post('/login', loginValidation, handleValidationErrors, loginUser);

// User profile routes (Protected)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// User history and chat routes (Protected)

router.get('/chat', protect, getUserChat);


// User settings routes (Protected)
router.get('/settings', protect, getUserSettings);
router.get('/settings/usersettings', protect, (req, res) => {
  res.render('users/settings/usersettings', { settings: req.user.settings });
});
router.get('/settings/chatbot', protect, (req, res) => {
  res.render('users/settings/chatbot', { settings: req.user.chatbotSettings });
});
router.get('/settings/general', protect, (req, res) => {
  res.render('users/settings/general', { settings: req.user.generalSettings });
});
router.get('/settings/other', protect, (req, res) => {
  res.render('users/settings/other', { settings: req.user.otherSettings });
});
router.get('/settings/security', protect, (req, res) => {
  res.render('users/settings/security', { settings: req.user.securitySettings });
});

// Update or save user settings (Protected)
router.post('/user-settings', protect, async (req, res) => {
  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prime status activation route (Protected)
router.post('/activate-prime', protect, activatePrimeStatus);

// Password reset route
router.post('/resetpassword', [
  check('email').isEmail().withMessage('Valid email is required'),
], handleValidationErrors, resetPassword);

module.exports = router;
