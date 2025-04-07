class NotificationTemplate {
  generateAppointmentConfirmation({ clientName, stylistName, date, time, services, totalPrice }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Confirmation</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been confirmed with the following details:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Services:</strong> ${services}</p>
            <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
          </div>
          <p>We look forward to seeing you!</p>
          <p>Need to make changes? You can manage your appointment through our app or website.</p>
        </div>
      `,
      text: `
Appointment Confirmation

Dear ${clientName},

Your appointment has been confirmed with the following details:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}
Services: ${services}
Total Price: $${totalPrice.toFixed(2)}

We look forward to seeing you!

Need to make changes? You can manage your appointment through our app or website.
      `,
      sms: `Your appointment with ${stylistName} is confirmed for ${formattedDate} at ${formattedTime}. Total: $${totalPrice.toFixed(2)}. Manage your booking in our app.`,
      push: `Appointment confirmed with ${stylistName} for ${formattedDate} at ${formattedTime}`
    };
  }

  generateAppointmentReminder({ clientName, stylistName, date, time }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>Dear ${clientName},</p>
          <p>This is a friendly reminder about your upcoming appointment:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
          </div>
          <p>We're looking forward to seeing you!</p>
          <p>If you need to reschedule, please do so at least 24 hours in advance.</p>
        </div>
      `,
      text: `
Appointment Reminder

Dear ${clientName},

This is a friendly reminder about your upcoming appointment:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}

We're looking forward to seeing you!

If you need to reschedule, please do so at least 24 hours in advance.
      `,
      sms: `Reminder: Your appointment with ${stylistName} is tomorrow at ${formattedTime}. Need to reschedule? Please do so 24h in advance.`,
      push: `Reminder: Your appointment with ${stylistName} is tomorrow at ${formattedTime}`
    };
  }

  generateAppointmentUpdate({ clientName, stylistName, date, time, services }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Update</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been updated. Here are the new details:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            <p><strong>Services:</strong> ${services}</p>
          </div>
          <p>If these changes don't work for you, please contact us to reschedule.</p>
        </div>
      `,
      text: `
Appointment Update

Dear ${clientName},

Your appointment has been updated. Here are the new details:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}
Services: ${services}

If these changes don't work for you, please contact us to reschedule.
      `,
      sms: `Your appointment has been updated: ${stylistName} on ${formattedDate} at ${formattedTime}. Services: ${services}. Questions? Please contact us.`,
      push: `Appointment updated: ${formattedDate} at ${formattedTime} with ${stylistName}`
    };
  }

  generateAppointmentCancellation({ clientName, stylistName, date, time, reason }) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedTime = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    const reasonText = reason ? ` Reason: ${reason}` : '';

    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Cancellation</h2>
          <p>Dear ${clientName},</p>
          <p>Your appointment has been cancelled:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Stylist:</strong> ${stylistName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>
          <p>We apologize for any inconvenience. Please use our app or website to schedule a new appointment.</p>
        </div>
      `,
      text: `
Appointment Cancellation

Dear ${clientName},

Your appointment has been cancelled:

Stylist: ${stylistName}
Date: ${formattedDate}
Time: ${formattedTime}${reasonText}

We apologize for any inconvenience. Please use our app or website to schedule a new appointment.
      `,
      sms: `Your appointment with ${stylistName} on ${formattedDate} at ${formattedTime} has been cancelled.${reasonText} Please reschedule at your convenience.`,
      push: `Appointment cancelled: ${formattedDate} at ${formattedTime}${reasonText}`
    };
  }
}

module.exports = { NotificationTemplate };