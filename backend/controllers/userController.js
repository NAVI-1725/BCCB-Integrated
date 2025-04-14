// backend/controllers/userController.js
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Chat = require('../models/chatModel'); // Corrected the path to chatModel
const UserSettings = require('../models/user/usersettingsModel');
const authMiddleware = require('../middleware/authMiddleware');
const crypto = require('crypto'); // Add crypto module for token generation
const nodemailer = require('nodemailer'); // Add nodemailer for sending emails
const dotenv = require('dotenv'); // Add dotenv for environment variable loading
dotenv.config(); // Load environment variables

// Utility function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};
// Send reset email function
const sendResetEmail = (email, resetToken) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Example with Gmail, replace with your email service provider
    auth: {
      user: process.env.EMAIL_USER,  // Email user from environment variables
      pass: process.env.EMAIL_PASSWORD,  // Email password from environment variables
    },
  });
  const resetUrl = `${process.env.CLIENT_URL}user/resetpassword/${resetToken}`; // Frontend URL to handle password reset
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Please click the link to reset your password: ${resetUrl}`,
  };
  return transporter.sendMail(mailOptions);
};
// Controller function for password reset
exports.resetPassword = async (req, res) => {
  const { email } = req.body;
  // Validate the email format
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = generateResetToken();

    // Set token in user's resetPasswordToken field and set expiration time (1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

    // Save user with token and expiration
    await user.save();

    // Send the reset password email
    await sendResetEmail(email, resetToken);

    res.status(200).json({ message: 'Password reset link has been sent to your email address.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean(); // Use .lean() for cleaner data
    console.log('User Profile:', user);  // Log user profile for debugging
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.render('users/userdashboard', { user }); // Pass user to the view
  } catch (error) {
    console.error('Error fetching user profile:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.user.id, { name, email, mobile }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error updating user profile:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};



// Get User Chat (API response for chat history)
exports.getUserChat = async (req, res) => {
  try {
    // Modified query to match the correct field 'userId' and 'timestamp'
    const chatHistory = await Chat.find({ userId: req.user.id }).sort({ timestamp: -1 }); // Adjust query as needed
    res.status(200).json({ success: true, chatHistor });
  } catch (error) {
    console.error('Error fetching user chat:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Settings
exports.getUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean(); // Retrieve user info
    const settings = await UserSettings.findOne({ userId: req.user.id }).lean(); // Retrieve user settings
    if (!user || !settings) {
      return res.status(404).json({ success: false, error: 'User or settings not found' });
    }
    res.render('users/settings', { user, settings }); // Pass both user and settings to the view
  } catch (error) {
    console.error('Error fetching user settings:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Chatbot Settings
exports.getChatbotSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user.id }, 'chatbotSettings').lean();
    if (!settings || !settings.chatbotSettings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    res.status(200).json({ success: true, settings: settings.chatbotSettings });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get General Settings
exports.getGeneralSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user.id }, 'generalSettings').lean();
    if (!settings || !settings.generalSettings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    res.status(200).json({ success: true, settings: settings.generalSettings });
  } catch (error) {
    console.error('Error fetching general settings:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Other Settings
exports.getOtherSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user.id }, 'otherSettings').lean();
    if (!settings || !settings.otherSettings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    res.status(200).json({ success: true, settings: settings.otherSettings });
  } catch (error) {
    console.error('Error fetching other settings:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Security Settings
exports.getSecuritySettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user.id }, 'securitySettings').lean();
    if (!settings || !settings.securitySettings) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    res.status(200).json({ success: true, settings: settings.securitySettings });
  } catch (error) {
    console.error('Error fetching security settings:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get User Account
exports.getUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      console.error('User not found in database'); // Log when user is not found
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`Retrieved user details: ${JSON.stringify(user, null, 2)}`); // Log retrieved user details
    res.render('users/account', { user, message: null, error: null }); // Pass the user to the view
  } catch (error) {
    console.error(`Error fetching user details: ${error.message}`); // Log error
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Update User Account Details
exports.updateUserAccount = async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.user.id, { name, email, mobile }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    // Optionally, set a message to be displayed after update
    res.status(200).json({ success: true, user, message: 'Account updated successfully!' });
  } catch (error) {
    console.error('Error updating user account:', error.message); // Log error
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update User Password
exports.updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the old password matches the stored password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error.message); // Log error
    res.status(500).json({ success: false, error: 'Error updating password' });
  }
};
