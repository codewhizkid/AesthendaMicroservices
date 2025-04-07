/**
 * Email Service - Mock Implementation
 * 
 * This is a development version that logs emails to console
 * Replace this with actual email sending logic in production
 */

// Configuration for email service
const EMAIL_CONFIG = {
  // Replace with actual SMTP settings in production
  fromEmail: 'noreply@aesthenda.com',
  fromName: 'Aesthenda Salon Management',
  enabled: true,
  development: true
};

/**
 * Email Templates
 */
const TEMPLATES = {
  // Welcome email sent after registration
  WELCOME: {
    subject: 'Welcome to Aesthenda!',
    generateHtml: (user) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #A9A29A; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Welcome to Aesthenda!</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eee;">
          <p>Hello ${user.firstName},</p>
          <p>Thank you for creating an account with Aesthenda Salon Management. We're excited to have you!</p>
          <p>You can now access our booking system to schedule appointments, manage your profile, and more.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5182/dashboard" 
               style="background-color: #A9A29A; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Go to Booking System
            </a>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Aesthenda Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} Aesthenda Salon Management. All rights reserved.</p>
        </div>
      </div>
    `,
    generateText: (user) => `
      Welcome to Aesthenda!
      
      Hello ${user.firstName},
      
      Thank you for creating an account with Aesthenda Salon Management. We're excited to have you!
      
      You can now access our booking system to schedule appointments, manage your profile, and more.
      
      Go to Booking System: http://localhost:5182/dashboard
      
      If you have any questions or need assistance, please don't hesitate to contact our support team.
      
      Best regards,
      The Aesthenda Team
      
      © ${new Date().getFullYear()} Aesthenda Salon Management. All rights reserved.
    `
  },
  
  // Password reset email template
  PASSWORD_RESET: {
    subject: 'Reset Your Aesthenda Password',
    generateHtml: (user, resetToken) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #A9A29A; padding: 20px; text-align: center;">
          <h1 style="color: #fff; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eee;">
          <p>Hello ${user.firstName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5182/reset-password?token=${resetToken}" 
               style="background-color: #A9A29A; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>Best regards,<br>The Aesthenda Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} Aesthenda Salon Management. All rights reserved.</p>
        </div>
      </div>
    `,
    generateText: (user, resetToken) => `
      Reset Your Aesthenda Password
      
      Hello ${user.firstName},
      
      We received a request to reset your password. Visit the link below to create a new password:
      
      http://localhost:5182/reset-password?token=${resetToken}
      
      If you didn't request this, you can safely ignore this email.
      
      Best regards,
      The Aesthenda Team
      
      © ${new Date().getFullYear()} Aesthenda Salon Management. All rights reserved.
    `
  }
};

/**
 * Send an email using templates
 * @param {string} templateName - Name of the template to use
 * @param {Object} recipient - Recipient information (email, firstName, etc.)
 * @param {Object} data - Additional data needed for the template
 * @returns {Promise} - Resolves when email is sent (or logged in development)
 */
export const sendTemplatedEmail = async (templateName, recipient, data = {}) => {
  if (!EMAIL_CONFIG.enabled) {
    console.log('Email sending is disabled.');
    return { success: false, reason: 'disabled' };
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    console.error(`Template "${templateName}" not found.`);
    return { success: false, reason: 'template_not_found' };
  }

  try {
    const emailData = {
      to: recipient.email,
      subject: template.subject,
      html: template.generateHtml(recipient, data.token),
      text: template.generateText(recipient, data.token),
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`
    };

    // In development, just log the email
    if (EMAIL_CONFIG.development) {
      console.log('==========================================');
      console.log('📧 MOCK EMAIL SENT');
      console.log('------------------------------------------');
      console.log(`To: ${emailData.to}`);
      console.log(`From: ${emailData.from}`);
      console.log(`Subject: ${emailData.subject}`);
      console.log('------------------------------------------');
      console.log('Text Content:');
      console.log(emailData.text);
      console.log('==========================================');
      
      return { 
        success: true, 
        messageId: `mock-${Date.now()}`,
        development: true
      };
    }
    
    // In production, this would be replaced with actual email sending code
    // Example with nodemailer:
    // const info = await transporter.sendMail(emailData);
    // return { success: true, messageId: info.messageId };
    
    throw new Error('Production email sending not implemented');
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

/**
 * Convenience function to send welcome email
 * @param {Object} user - User object with email and firstName
 * @returns {Promise} - Result of sending the email
 */
export const sendWelcomeEmail = (user) => {
  return sendTemplatedEmail('WELCOME', user);
};

/**
 * Convenience function to send password reset email
 * @param {Object} user - User object with email and firstName
 * @param {string} resetToken - Password reset token
 * @returns {Promise} - Result of sending the email
 */
export const sendPasswordResetEmail = (user, resetToken) => {
  return sendTemplatedEmail('PASSWORD_RESET', user, { token: resetToken });
};

export default {
  sendTemplatedEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};