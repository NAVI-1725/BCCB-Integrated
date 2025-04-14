const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // Convert "true" or "false" from .env to boolean
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email details
const mailOptions = {
  from: process.env.SMTP_USER,
  to: 'recipient@example.com', // Replace with the recipient's email address
  subject: 'Test Email',
  text: 'This is a test email sent from Node.js!',
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Email sent successfully:', info.response);
  }
});
