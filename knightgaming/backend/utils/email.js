/**
 * Email Utilities
 * Send transactional emails using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
let transporter = null;

const initEmailTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    logger.info('Email transporter initialized');
  } catch (error) {
    logger.error('Error initializing email transporter:', error);
  }
};

/**
 * Send email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.warn('Email transporter not initialized, skipping email send');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@knightgaming.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to KnightGaming!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to KnightGaming, ${user.username}!</h1>
      <p>Thank you for joining our gaming community.</p>
      <p>You can now:</p>
      <ul>
        <li>Track live player counts for your favorite games</li>
        <li>Read the latest gaming news</li>
        <li>Write reviews and climb leaderboards</li>
        <li>Join our community discussions</li>
      </ul>
      <p>Consider upgrading to Premium for ad-free experience and exclusive features!</p>
      <p><a href="${process.env.CLIENT_URL}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Visit KnightGaming</a></p>
      <p style="color: #666; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send subscription confirmation email
 */
const sendSubscriptionEmail = async (user, subscription) => {
  const subject = 'KnightGaming Premium Subscription Activated!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Premium Subscription Activated!</h1>
      <p>Hi ${user.username},</p>
      <p>Your KnightGaming Premium subscription is now active.</p>
      <h3>Benefits:</h3>
      <ul>
        <li>Ad-free browsing</li>
        <li>Detailed statistics and analytics</li>
        <li>AI-powered content recommendations</li>
        <li>Early access to new features</li>
        <li>Priority support</li>
      </ul>
      <p><strong>Next billing date:</strong> ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
      <p><a href="${process.env.CLIENT_URL}/account" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Subscription</a></p>
      <p style="color: #666; font-size: 12px;">Questions? Contact us at ${process.env.ADMIN_EMAIL}</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Password Reset Request</h1>
      <p>Hi ${user.username},</p>
      <p>You requested to reset your password. Click the button below to set a new password:</p>
      <p><a href="${resetUrl}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <p style="color: #666; font-size: 12px;">For security, never share this email with anyone.</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

/**
 * Send admin alert email
 */
const sendAdminAlert = async (subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ef4444;">Admin Alert</h1>
      <p>${message}</p>
      <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
    </div>
  `;

  return await sendEmail({
    to: process.env.ADMIN_EMAIL,
    subject: `[KnightGaming Alert] ${subject}`,
    html
  });
};

module.exports = {
  initEmailTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendSubscriptionEmail,
  sendPasswordResetEmail,
  sendAdminAlert
};
