const nodemailer = require('nodemailer');
const templateEngine = require('../templates/template-engine');

class EmailProvider {
  constructor() {
    this.transporter = null;
    this.isMock = process.env.NODE_ENV !== 'production';
  }

  async initialize() {
    try {
      if (this.isMock) {
        console.log('Using mock email provider for development');
        
        // Create a test account if we're in development mode
        const testAccount = await nodemailer.createTestAccount().catch(err => {
          console.warn('Could not create test email account:', err.message);
          return null;
        });
        
        if (testAccount) {
          // Create a testing transporter
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          console.log('Created test email account at ethereal.email');
        } else {
          // Just log emails to console
          this.transporter = {
            sendMail: async (options) => {
              console.log('MOCK EMAIL:');
              console.log('To:', options.to);
              console.log('Subject:', options.subject);
              console.log('Text:', options.text?.substring(0, 100) + '...');
              return { messageId: 'mock_' + Date.now() };
            },
            verify: async () => true,
            close: async () => {}
          };
        }
        return;
      }
      
      // Create reusable transporter object using SMTP transport
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection configuration
      await this.transporter.verify();
      console.log('Email provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email provider:', error);
      console.log('Falling back to mock implementation');
      
      // Set up a mock email provider
      this.isMock = true;
      this.transporter = {
        sendMail: async (options) => {
          console.log('MOCK EMAIL:');
          console.log('To:', options.to);
          console.log('Subject:', options.subject);
          console.log('Text:', options.text?.substring(0, 100) + '...');
          return { messageId: 'mock_' + Date.now() };
        },
        verify: async () => true,
        close: async () => {}
      };
    }
  }

  async send({ to, subject, html, text }) {
    if (!this.transporter) {
      throw new Error('Email provider not initialized');
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'notifications@aesthenda.com',
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (this.isMock) {
        console.log('Mock email sent successfully:', info.messageId);
      } else {
        console.log('Email sent successfully:', info.messageId);
        
        // If using Ethereal for testing, log the preview URL
        if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
      }
      
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // New methods for template-based emails
  async sendAppointmentConfirmation({ to, data }) {
    try {
      const html = templateEngine.renderAppointmentConfirmation(data);
      const text = this.extractTextFromHtml(html);
      
      return await this.send({
        to,
        subject: `${data.tenantName}: Your Appointment Confirmation`,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send appointment confirmation email:', error);
      throw error;
    }
  }

  async sendAppointmentReminder({ to, data }) {
    try {
      const html = templateEngine.renderAppointmentReminder(data);
      const text = this.extractTextFromHtml(html);
      
      return await this.send({
        to,
        subject: `${data.tenantName}: Reminder of Your Upcoming Appointment`,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send appointment reminder email:', error);
      throw error;
    }
  }

  async sendAppointmentCancelled({ to, data }) {
    try {
      const html = templateEngine.renderAppointmentCancelled(data);
      const text = this.extractTextFromHtml(html);
      
      return await this.send({
        to,
        subject: `${data.tenantName}: Your Appointment Has Been Cancelled`,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send appointment cancellation email:', error);
      throw error;
    }
  }

  async sendAppointmentUpdated({ to, data }) {
    try {
      const html = templateEngine.renderAppointmentUpdated(data);
      const text = this.extractTextFromHtml(html);
      
      return await this.send({
        to,
        subject: `${data.tenantName}: Your Appointment Has Been Updated`,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send appointment update email:', error);
      throw error;
    }
  }

  // Helper function to extract plain text from HTML
  extractTextFromHtml(html) {
    // Very basic HTML to text conversion
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  async shutdown() {
    if (this.transporter && typeof this.transporter.close === 'function') {
      this.transporter.close();
      console.log('Email provider shut down');
    }
  }
}

module.exports = { EmailProvider };