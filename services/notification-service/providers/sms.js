let twilio;
try {
  twilio = require('twilio');
} catch (error) {
  console.warn('Twilio SDK not available, using mock implementation for SMS');
  twilio = null;
}

class SMSProvider {
  constructor() {
    this.client = null;
    this.isMock = !twilio;
    this.fromNumber = null;
  }

  async initialize() {
    try {
      if (this.isMock) {
        console.log('Using mock SMS provider');
        return;
      }
      
      // Check if credentials exist before initializing client
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
      
      if (!accountSid || !authToken || !this.fromNumber) {
        console.warn('Twilio credentials not provided, using mock implementation');
        this.isMock = true;
        return;
      }
      
      // Initialize client with credentials
      try {
        this.client = twilio(accountSid, authToken);
        
        // Verify credentials by making a test API call
        await this.client.api.accounts(accountSid).fetch();
        console.log('SMS provider initialized successfully with Twilio');
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
        console.log('Falling back to mock implementation');
        this.isMock = true;
      }
    } catch (error) {
      console.error('Failed to initialize SMS provider:', error);
      console.log('Falling back to mock implementation');
      this.isMock = true;
    }
  }

  async send({ to, message }) {
    if (this.isMock) {
      console.log('MOCK: SMS would be sent to:', to);
      console.log('MOCK: SMS content:', message);
      return { sid: 'MOCK_SID_' + Date.now() };
    }
    
    if (!this.client) {
      throw new Error('SMS provider not initialized');
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        to: this.formatPhoneNumber(to),
        from: this.fromNumber
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
    if (this.isMock) {
      console.log('MOCK: SMS provider shut down');
      return;
    }
    
    // No specific cleanup needed for Twilio client
    this.client = null;
    console.log('SMS provider shut down');
  }
}

module.exports = { SMSProvider }; 