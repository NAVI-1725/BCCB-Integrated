const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { sendEmail } = require('../config/emailservice');  // Import the sendEmail function

// Helper function to generate JWT token
const generateToken = (id, expiresIn = '24h') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// Register User Controller
const registerUser = async (req, res) => {
  const { name, email, password, mobile } = req.body;

  // Validate mandatory fields
  if (!name || !email || !password || !mobile) {
    return res.render("users/userregister", { 
      error: "All fields are mandatory.",
      name,
      email,
      mobile 
    });
  }

  // Validate the mobile number format (exactly 10 digits)
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile)) {
    return res.render("users/userregister", { 
      error: "Please provide a valid 10-digit mobile number.",
      name,
      email,
      mobile 
    });
  }

  try {
    // Check if a user already exists with the given email or mobile
    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.render("users/userregister", { 
        error: "User already exists with this email or mobile number.",
        name,
        email,
        mobile 
      });
    }

    // Create a new user; password hashing is handled via Mongoose pre-save middleware
    const newUser = new User({ name, email, mobile, password });
    await newUser.save();

    // Generate a token (assuming generateToken is a function that creates a JWT or similar)
    const token = generateToken(newUser._id);

    // Set an HTTP-only cookie with the token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    // On successful registration, redirect to login page with a success query parameter
    return res.redirect("/user/login?success=registered_successfully");
  } catch (error) {
    // Log the error for debugging
    console.error("Error during user registration:", error);

    let errorMessage = "Internal Server Error. Please try again.";

    // If the error is due to validation errors from Mongoose, gather all error messages
    if (error.name === "ValidationError") {
      errorMessage = Object.values(error.errors)
        .map(val => val.message)
        .join(" ");
    }
    // Handle duplicate key error (MongoDB error code 11000)
    else if (error.code === 11000) {
      errorMessage = "User already exists with this email or mobile number.";
    }
    
    // Render the registration page with the error message and previous input values
    return res.render("users/userregister", { 
      error: errorMessage,
      name,
      email,
      mobile 
    });
  }
};


// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('users/userlogin', { error: 'Both email and password are required.' });
  }

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return res.render('users/userlogin', { error: 'Invalid email or password. Please try again.' });
    }

    // Check password using matchPassword function
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      console.log(`Login failed: Incorrect password for email ${email}`);
      return res.render('users/userlogin', { error: 'Invalid email or password. Please try again.' });
    }

    // Successful login
    const token = generateToken(user._id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    res.redirect('/user/dashboard');
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).render('users/userlogin', { error: 'Server error. Please try again later.' });
  }
};


// Logout User
const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token');
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
};

// Update User Account
const updateUserAccount = async (req, res) => {
  const { name, email, mobile } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;

    await user.save();
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Activate Prime Status
const activatePrimeStatus = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (code !== 'VALID_CODE') {
      return res.status(400).json({ success: false, error: 'Invalid code' });
    }

    user.primeUser = true;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      // Render the same forgot password page with an error message
      return res.render('users/forgotpassword', { error: 'User does not exist' });
    }

    const resetToken = generateToken(user._id, '1h');
    const resetLink = `${process.env.CLIENT_URL}/user/resetpassword/${resetToken}`;

    console.log('Password reset link generated:', resetLink);

    // Send the reset password email
    await sendEmail(email, 'Password Reset Request', `<p>Dear user, <br> <br> Please click <a href="${resetLink}">here</a> to reset your password.<br> The link expires in 1 hour.</p>`);

    // Render the forgot password page with a success message
    return res.render('users/forgotpassword', { success: 'Password reset email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Error in forgotPassword:', err);
    return res.render('users/forgotpassword', { error: 'Server error. Please try again later.' });
  }
};

// Verify Reset Token
const verifyResetToken = (req, res) => {
  const { token } = req.params;

  try {
    console.log('Verifying reset token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully for user ID:', decoded.id);
    res.render('users/resetpassword', { token }); // Pass the token to the template
  } catch (err) {
    console.error('Error verifying reset token:', err);
    res.status(400).render('users/error', { message: 'Invalid or expired token' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const { token } = req.params; // Correct token extraction from URL params

  // Password mismatch check
  if (newPassword !== confirmPassword) {
    console.log('Passwords do not match');
    return res.status(400).render('users/resetpassword', { error: 'Passwords do not match', token });
  }

  try {
    console.log('Resetting password with token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded for user ID:', decoded.id);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(404).render('users/error', { message: 'User not found' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      console.log('New password is the same as the old password');
      return res.status(400).render('users/resetpassword', { error: 'New password must be different from the old password', token });
    }

    // Hash new password and save it
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log('Password reset successfully for user ID:', user._id);

    // Send confirmation email
    await sendEmail(user.email, 'Password Reset Successful', `<p>Your password has been reset successfully. If you did not make this request, please contact support immediately.</p>`);

    // Render success page or return appropriate response
    res.render('users/resetsuccess', { message: 'Password reset successfully. Please check your email for confirmation.' });

  } catch (err) {
    console.error('Error in resetPassword:', err);
    res.status(400).render('users/error', { message: 'Invalid or expired token' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  updateUserAccount,
  activatePrimeStatus,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
