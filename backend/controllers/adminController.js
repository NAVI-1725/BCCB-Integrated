const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const AdminSettings = require('../models/admin/adminsettingsModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const axios = require('axios');
const cheerio = require('cheerio');

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Register Admin
exports.registerAdmin = async (req, res) => {
  const { name, email, password, mobile, passcode } = req.body;

  if (!name || !email || !password || !mobile || !passcode) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    if (passcode !== process.env.ADMIN_PASSCODE) {
      return res.status(403).json({ error: 'Invalid passcode' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({ name, email, password: hashedPassword, mobile, passcode });
    await newAdmin.save();

    const token = generateToken(newAdmin._id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.redirect('/admin/login?message=registration_success');
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const path = require('path');

// Login Admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.render('admin/adminlogin', { query: { failed: true } });
  }

  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found with email:', email); // Debugging
      return res.render('admin/adminlogin', { query: { failed: true } });
    }

    // Match the provided password with the stored password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.render('admin/adminlogin', { query: { failed: true } });
    }

    // Generate a JWT token
    const token = generateToken(admin._id);

    // Set the token in a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    // Redirect to the admin dashboard
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('admin/adminlogin', { query: { failed: true } });
  }
};


// View Users
exports.viewUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin/viewusers', { users, user: req.user || null });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Error fetching users');
  }
};

// View Admins
exports.viewAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.render('admin/viewadmins', { admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).send('Server Error');
  }
};


// Upload File
exports.uploadFile = (req, res) => {
  upload.single('file')(req, res, async function (err) {
    const pythonServerUrl = 'http://127.0.0.1:5050/process_file';

    if (err) {
      return res.render('admin/uploadfile', {
        status: 'error',
        message: 'File upload failed. Please try again.',
        file: null,
      });
    }

    // ✅ Use __dirname + path.resolve to build true absolute path
    const absolutePath = path.resolve(__dirname, '../uploads', req.file.filename);

    try {
      const response = await axios.post(pythonServerUrl, {
        filePath: absolutePath,
        vectorStoreName: 'default',
      });

      const data = response.data;

      if (data.success) {
        res.render('admin/uploadfile', {
          status: 'success',
          message: 'File uploaded and processed successfully!',
          file: req.file,
        });
      } else {
        res.render('admin/uploadfile', {
          status: 'error',
          message: 'Processing failed: ' + data.message,
          file: req.file,
        });
      }
    } catch (error) {
      console.error('Python API error:', error.message);
      res.render('admin/uploadfile', {
        status: 'error',
        message: 'File uploaded but failed to process: ' + error.message,
        file: req.file,
      });
    }
  });
};


// Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const totalMessages = await Chat.countDocuments({});

    res.render('admin/admindashboard', {
      totalAdmins,
      totalUsers,
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).send('Error fetching dashboard data');
  }
};

// Admin Settings
exports.getAdminSettings = async (req, res) => {
  const { type } = req.params;

  try {
    const settings = await AdminSettings.findOne({ type });
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ error: 'Error fetching admin settings' });
  }
};

// Update Admin Settings
exports.updateAdminSettings = async (req, res) => {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Settings type is required' });
  }

  try {
    const updatedSettings = await AdminSettings.findOneAndUpdate(
      { type },
      req.body,
      { new: true, upsert: true }
    );
    res.status(200).json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ error: 'Error updating admin settings' });
  }
};

// General Settings
exports.getGeneralSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: 'general' });
    if (!settings) {
      return res.status(404).json({ error: 'General settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({ error: 'Error fetching general settings' });
  }
};

// Privacy Settings
exports.getPrivacySettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: 'privacy' });
    if (!settings) {
      return res.status(404).json({ error: 'Privacy settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: 'Error fetching privacy settings' });
  }
};

// Chatbot Settings
exports.getChatbotSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: 'chatbot' });
    if (!settings) {
      return res.status(404).json({ error: 'Chatbot settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    res.status(500).json({ error: 'Error fetching chatbot settings' });
  }
};

// Other Settings
exports.getOtherSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: 'other' });
    if (!settings) {
      return res.status(404).json({ error: 'Other settings not found' });
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error('Error fetching other settings:', error);
    res.status(500).json({ error: 'Error fetching other settings' });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const allChats = await Chat.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, allChats });
  } catch (error) {
    console.error("Error in getAllChats:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve all chats. Please try again later." 
    });
  }
};
