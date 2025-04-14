const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Ensure the correct path to your User model
const Admin = require('../models/adminModel'); // Ensure the correct path to your Admin model

// Helper function to extract token from request
const extractToken = (req) => {
  try {
    // Check for token in cookies or Authorization header
    return req.cookies?.token || 
           (req.headers.authorization?.startsWith('Bearer ') 
             ? req.headers.authorization.split(' ')[1] 
             : null);
  } catch (error) {
    console.error(`Token extraction error: ${error.message}`);
    return null;
  }
};

// Middleware to protect user routes
const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    console.error('Unauthorized: No token provided');
    return res.status(401).render('unauthorized', {
      message: 'Access denied. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password'); // Exclude password from user data

    if (!req.user) {
      console.error('Unauthorized: User not found');
      return res.status(401).render('unauthorized', {
        message: 'User not found. Please log in.',
      });
    }
    next();
  } catch (error) {
    console.error(`Token verification error: ${error.message}`);
    return res.status(401).render('unauthorized', {
      message: 'Invalid token. Please log in.',
    });
  }
};

// Middleware to protect admin routes
const protectAdmin = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    console.error('Unauthorized: No token provided');
    return res.status(401).render('unauthorized', {
      message: 'Access denied. Admin login required.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('-password'); // Exclude password from admin data

    if (!req.admin) {
      console.error('Forbidden: Admin not found');
      return res.status(403).render('unauthorized', {
        message: 'Admin not found. Please log in.',
      });
    }

    console.log(`Admin authenticated successfully: ${req.admin.name} (${req.admin.email})`);
    next();
  } catch (error) {
    console.error(`Token verification error: ${error.message}`);
    return res.status(401).render('unauthorized', {
      message: 'Invalid token. Please log in as admin.',
    });
  }
};

module.exports = { protect, protectAdmin };