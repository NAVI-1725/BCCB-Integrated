const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Admin = require('./models/adminModel'); // Update the path as needed

dotenv.config();

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// Generate JWT token for admin
const generateTokenForAdmin = async () => {
  await connectToDatabase();

  // Use the provided admin ID
  const adminId = '66c6ef8e90aa93f75bfed514'; // Ensure this ID is correct in your database

  try {
    // Verify if the admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      console.error('Admin not found');
      process.exit(1);
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h' // Token expires in 1 hour
    });

    console.log('Generated Token:', token);
  } catch (error) {
    console.error('Error generating token:', error);
  }

  mongoose.connection.close();
};

generateTokenForAdmin();
