const templateEngine = require('./template-engine');
const path = require('path');
const fs = require('fs');

class NotificationTemplate {
  constructor() {
    // Force initialization of template engine
    if (!fs.existsSync(path.join(__dirname, 'email', 'base.hbs'))) {
      console.warn('Template files not found. Using legacy template methods.');
      this.useHandlebarsTemplates = false;
    } else {
      this.useHandlebarsTemplates = true;
    }
  }

  formatAppointmentTemplateData({ 
    clientName, 
    stylistName, 
    date, 
    time, 
    services, 
    totalPrice, 
    tenantId,
    tenantName = 'Aesthenda Salon & Spa',
    logoUrl = '', 
    primaryColor = '#4A90E2',
    appointmentUrl = '',
    tenantAddress = '',
    tenantPhone = '',
    tenantEmail = '',
    reason = ''
  }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = time.includes(':') ? time : 
      new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

    return {
      clientName,
      stylistName,
      date,
      time,
      formattedDate,
      formattedTime,
      services: Array.isArray(services) ? services.join(', ') : services,
      totalPrice: typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice,
      tenantId,
      tenantName,
      logoUrl,
      primaryColor,
      appointmentUrl,
      bookingUrl: appointmentUrl, // alias for consistent templates
      tenantAddress,
      tenantPhone,
      tenantEmail,
      reason
    };
  }

  generateAppointmentConfirmation(data) {
    if (this.useHandlebarsTemplates) {
      return {
        html: templateEngine.renderAppointmentConfirmation(this.formatAppointmentTemplateData(data)),
        text: this.generateLegacyAppointmentConfirmation(data).text,
        sms: this.generateLegacyAppointmentConfirmation(data).sms,
        push: this.generateLegacyAppointmentConfirmation(data).push
      };
    }
    
    return this.generateLegacyAppointmentConfirmation(data);
  }

  generateAppointmentReminder(data) {
    if (this.useHandlebarsTemplates) {
      return {
        html: templateEngine.renderAppointmentReminder(this.formatAppointmentTemplateData(data)),
        text: this.generateLegacyAppointmentReminder(data).text,
        sms: this.generateLegacyAppointmentReminder(data).sms,
        push: this.generateLegacyAppointmentReminder(data).push
      };
    }
    
    return this.generateLegacyAppointmentReminder(data);
  }

  generateAppointmentUpdate(data) {
    if (this.useHandlebarsTemplates) {
      return {
        html: templateEngine.renderAppointmentUpdated(this.formatAppointmentTemplateData(data)),
        text: this.generateLegacyAppointmentUpdate(data).text,
        sms: this.generateLegacyAppointmentUpdate(data).sms,
        push: this.generateLegacyAppointmentUpdate(data).push
      };
    }
    
    return this.generateLegacyAppointmentUpdate(data);
  }

  generateAppointmentCancellation(data) {
    if (this.useHandlebarsTemplates) {
      return {
        html: templateEngine.renderAppointmentCancelled(this.formatAppointmentTemplateData(data)),
        text: this.generateLegacyAppointmentCancellation(data).text,
        sms: this.generateLegacyAppointmentCancellation(data).sms,
        push: this.generateLegacyAppointmentCancellation(data).push
      };
    }
    
    return this.generateLegacyAppointmentCancellation(data);
  }

  // Legacy methods (kept for backward compatibility)
  generateLegacyAppointmentConfirmation({ clientName, stylistName, date, time, services, totalPrice, salonName = 'Our Salon', salonLogo = '', primaryColor = '#4A90E2' }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = time.includes(':') ? time : 
      new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${salonLogo ? `<div style="text-align: center; margin: 20px 0;"><img src="${salonLogo}" alt="${salonName}" style="max-width: 150px;"></div>` : ''}
          <h2 style="color: ${primaryColor};">${salonName} - Appointment Confirmation</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Services:</strong> ${services}</p>
            <p><strong>Total Price:</strong> $${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}</p>
          </div>
          <p>We look forward to seeing you!</p>
          <p>Need to make changes? You can manage your appointment through our app or website.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>${salonName}</p>
            <p>This email was sent to you because you have an appointment with us.</p>
          </div>
        </div>
      `,
      text: `
${salonName} - Appointment Confirmation

Dear ${clientName},

Your appointment has been confirmed with the following details:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}
Services: ${services}
Total Price: $${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}

We look forward to seeing you!

Need to make changes? You can manage your appointment through our app or website.
      `,
      sms: `${salonName}: Your appointment with ${stylistName} is confirmed for ${formattedDate} at ${formattedTime}. Total: $${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}.`,
      push: `${salonName}: Appointment confirmed with ${stylistName} for ${formattedDate} at ${formattedTime}`
    };
  }

  generateLegacyAppointmentReminder({ clientName, stylistName, date, time, salonName = 'Our Salon', primaryColor = '#4A90E2' }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = time.includes(':') ? time : 
      new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${primaryColor};">${salonName} - Appointment Reminder</h2>
          <p>Dear ${clientName},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
          </div>
          <p>We're looking forward to seeing you!</p>
          <p>If you need to reschedule, please do so at least 24 hours in advance.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>${salonName}</p>
          </div>
        </div>
      `,
      text: `
${salonName} - Appointment Reminder

Dear ${clientName},

This is a friendly reminder about your upcoming appointment:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}

We're looking forward to seeing you!

If you need to reschedule, please do so at least 24 hours in advance.
      `,
      sms: `${salonName}: Reminder - Your appointment with ${stylistName} is tomorrow at ${formattedTime}. Need to reschedule? Please do so 24h in advance.`,
      push: `${salonName}: Reminder - Your appointment with ${stylistName} is tomorrow at ${formattedTime}`
    };
  }

  generateLegacyAppointmentUpdate({ clientName, stylistName, date, time, services, salonName = 'Our Salon', primaryColor = '#4A90E2' }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = time.includes(':') ? time : 
      new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${primaryColor};">${salonName} - Appointment Update</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been updated. Here are the new details:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Services:</strong> ${services}</p>
          </div>
          <p>If these changes don't work for you, please contact us to reschedule.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>${salonName}</p>
          </div>
        </div>
      `,
      text: `
${salonName} - Appointment Update

Dear ${clientName},

Your appointment has been updated. Here are the new details:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}
Services: ${services}

If these changes don't work for you, please contact us to reschedule.
      `,
      sms: `${salonName}: Your appointment has been updated: ${stylistName} on ${formattedDate} at ${formattedTime}. Services: ${services}. Questions? Please contact us.`,
      push: `${salonName}: Appointment updated: ${formattedDate} at ${formattedTime} with ${stylistName}`
    };
  }

  generateLegacyAppointmentCancellation({ clientName, stylistName, date, time, reason, salonName = 'Our Salon', primaryColor = '#4A90E2' }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = time.includes(':') ? time : 
      new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

    const reasonText = reason ? ` Reason: ${reason}` : '';

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${primaryColor};">${salonName} - Appointment Cancellation</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been cancelled:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${primaryColor};">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>We apologize for any inconvenience. Please use our app or website to schedule a new appointment.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>${salonName}</p>
          </div>
        </div>
      `,
      text: `
${salonName} - Appointment Cancellation

Dear ${clientName},

Your appointment has been cancelled:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}${reasonText}

We apologize for any inconvenience. Please use our app or website to schedule a new appointment.
      `,
      sms: `${salonName}: Your appointment with ${stylistName} on ${formattedDate} at ${formattedTime} has been cancelled.${reasonText} Please reschedule at your convenience.`,
      push: `${salonName}: Appointment cancelled: ${formattedDate} at ${formattedTime}${reasonText}`
    };
  }
}

module.exports = { NotificationTemplate };