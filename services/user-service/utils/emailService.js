const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Sends an email using nodemailer
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.html - Email HTML content
 * @param {String} options.text - Email plain text content (optional)
 * @returns {Promise} - Resolves when email is sent
 */
const sendEmail = async (options) => {
  try {
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password
      }
    });

    // Set up email options
    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    // Add plain text if provided
    if (options.text) {
      mailOptions.text = options.text;
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// If we're in a testing environment, mock the email sending
if (process.env.NODE_ENV === 'test') {
  module.exports = async (options) => {
    console.log('Mock email sent:', options);
    return { messageId: 'mock-id' };
  };
} else {
  module.exports = sendEmail;
} 