const User = require('../models/userModel');
const UserSettings = require('../models/user/usersettingsModel');
const AdminSettings = require('../models/admin/adminsettingsModel');
const bcrypt = require('bcryptjs');

// Get User Settings
exports.getUserSettings = async (req, res) => {
  try {
    // Fetch user and populate the settings field if it's a reference
    const user = await User.findById(req.user.id).populate('settings'); // Assuming req.user contains authenticated user's ID

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch user settings if available
    const userSettings = await UserSettings.findOne({ userId: user._id });

    // Render the settings page and pass the user and settings object to the view
    res.render('user/settings/usersettings', {
      user,
      settings: userSettings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update User Settings
exports.updateUserSettings = async (req, res) => {
  const { settings } = req.body;

  try {
    // Find and update the user's settings
    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { ...settings },
      { new: true, upsert: true }
    );

    if (!updatedSettings) {
      return res.status(404).json({ success: false, error: 'User settings not found' });
    }

    // Return success response
    res.status(200).json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Admin Settings
exports.getAdminSettings = async (req, res) => {
  try {
    // Fetch admin settings from the AdminSettings model
    const settings = await AdminSettings.findOne(); // Adjust as needed
    if (!settings) {
      return res.status(404).json({ success: false, error: 'Admin settings not found' });
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Admin Settings
exports.updateAdminSettings = async (req, res) => {
  const { settings } = req.body;

  try {
    // Update admin settings with the provided data
    const updatedSettings = await AdminSettings.findOneAndUpdate({}, settings, { new: true });

    if (!updatedSettings) {
      return res.status(404).json({ success: false, error: 'Admin settings not found' });
    }

    res.status(200).json({ success: true, settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Password
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Compare current password with stored password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash the new password and update it
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
