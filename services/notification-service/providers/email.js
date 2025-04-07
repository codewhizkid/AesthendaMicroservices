const nodemailer = require('nodemailer');

class EmailProvider {
  constructor() {
    this.transporter = null;
  }

  async initialize() {
    try {
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
      throw error;
    }
  }

  async send({ to, subject, html, text }) {
    if (!this.transporter) {
      throw new Error('Email provider not initialized');
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM_ADDRESS,
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async shutdown() {
    if (this.transporter) {
      this.transporter.close();
      console.log('Email provider shut down');
    }
  }
}

module.exports = { EmailProvider };