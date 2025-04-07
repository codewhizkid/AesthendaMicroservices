const twilio = require('twilio');

class SMSProvider {
  constructor() {
    this.client = null;
  }

  async initialize() {
    try {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      // Verify credentials by making a test API call
      await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('SMS provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SMS provider:', error);
      throw error;
    }
  }

  async send({ to, message }) {
    if (!this.client) {
      throw new Error('SMS provider not initialized');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        to: this.formatPhoneNumber(to),
        from: process.env.TWILIO_PHONE_NUMBER
      });

      console.log('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Ensure number starts with country code
    if (!cleaned.startsWith('1')) {
      return `+1${cleaned}`;
    }
    return `+${cleaned}`;
  }

  async shutdown() {
    // No specific cleanup needed for Twilio client
    this.client = null;
    console.log('SMS provider shut down');
  }
}

module.exports = { SMSProvider }; 