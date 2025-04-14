const mongoose = require('mongoose');
const { Schema } = mongoose;

// Combine admin-specific settings into one schema
const adminSettingsSchema = new Schema({
  // Admin-specific settings can be defined here
  dashboardPreferences: {
    showUserStats: { type: Boolean, default: true },
    showAdminActivities: { type: Boolean, default: true },
  },
  securityPolicies: {
    enforceStrongPasswords: { type: Boolean, default: true },
    twoFactorRequired: { type: Boolean, default: false },
  },
  accessibilitySettings: {
    enableDarkMode: { type: Boolean, default: false },
    allowCustomThemes: { type: Boolean, default: true },
  },
});

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
