const nodemailer = require('nodemailer');
require('dotenv').config(); 

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',  // Convert to boolean
  auth: {
    user: process.env.SMTP_USER,  // Your Gmail address
    pass: process.env.SMTP_PASS,  // Your Gmail App Password
  },
});

// Function to send email
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log('Email sent:', info.response);
  } catch (error) {
    throw new Error('Email sending failed');
  }
};

module.exports = { sendEmail };
