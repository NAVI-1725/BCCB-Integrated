const mongoose = require('mongoose');
const { Schema } = mongoose;

// Combine all settings into one schema
const userSettingsSchema = new Schema({
  // Chatbot Settings
  chatbotSettings: {
    chatHistory: {
      view: { type: Boolean, default: true },
      clear: { type: Boolean, default: true },
      export: { type: Boolean, default: true },
      pauseRecording: { type: Boolean, default: false },
    },
    privacySettings: {
      lockChat: { type: Boolean, default: false },
    },
    preferences: {
      enableFeatures: [{ type: String }],
      defaultResponseStyle: { type: String, default: 'formal' },
      voiceSettings: {
        volume: { type: Number, default: 50 },
        pitch: { type: Number, default: 1 },
      },
    },
  },

  // General Settings
  generalSettings: {
    profileSettings: {
      editProfilePicture: { type: Boolean, default: true },
      updateUsername: { type: Boolean, default: true },
      updateEmail: { type: Boolean, default: true },
      changePassword: { type: Boolean, default: true },
    },
    themeSettings: {
      darkMode: { type: Boolean, default: false },
      themeColors: { type: Map, of: String },
      fontSize: { type: Number, default: 14 },
      fontStyle: { type: String, default: 'Arial' },
    },
    languageAndRegion: {
      preferredLanguage: { type: String, default: 'English' },
    },
  },

  // Other Settings
  otherSettings: {
    feedbackAndSupport: {
      provideFeedback: { type: Boolean, default: true },
      accessSupportDocs: { type: Boolean, default: true },
      contactSupport: { type: Boolean, default: true },
    },
    legalAndCompliance: {
      termsOfService: { type: Boolean, default: true },
      privacyPolicy: { type: Boolean, default: true },
      cookieSettings: { type: Boolean, default: true },
    },
  },

  // Security Settings
  securitySettings: {
    twoFactorAuthentication: {
      enabled: { type: Boolean, default: false },
      methods: [{ type: String }],
    },
    loginActivity: {
      recentLogins: [{ type: Date }],
      authorizedDevices: [{ type: String }],
    },
    accountSecurity: {
      securityQuestions: [{ question: String, answer: String }],
      backupCodes: [{ code: String }],
    },
  },
});

module.exports = mongoose.model('UserSettings', userSettingsSchema);
