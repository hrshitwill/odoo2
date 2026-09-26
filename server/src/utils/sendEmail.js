const nodemailer = require('nodemailer');

/**
 * Sends transactional email (e.g. Password Reset OTP)
 * Falls back to console simulation if SMTP credentials are placeholder or offline
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const isPlaceholder =
      !process.env.EMAIL_USER ||
      process.env.EMAIL_USER.includes('your_email') ||
      !process.env.EMAIL_PASS ||
      process.env.EMAIL_PASS.includes('your_app_password');

    if (isPlaceholder) {
      console.log(`\n==================================================`);
      console.log(`📧 [StockSense Email Dispatch - Development Simulation]`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${text}`);
      console.log(`==================================================\n`);
      return { sent: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"StockSense Security" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Service] Message sent successfully to ${to}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Warning] Could not dispatch SMTP email: ${error.message}`);
    // Return gracefully so user flow is not broken
    return { sent: false, error: error.message };
  }
};

module.exports = sendEmail;
