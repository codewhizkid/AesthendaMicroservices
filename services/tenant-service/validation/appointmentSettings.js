const validateDuration = (duration) => {
  return Number.isInteger(duration) && duration > 0 && duration <= 480; // Max 8 hours
};

const validateBuffer = (buffer) => {
  return Number.isInteger(buffer) && buffer >= 0 && buffer <= 60; // Max 1 hour
};

const validateCancellationPolicy = (policy) => {
  if (!policy) return false;
  
  const validTypes = ['hours_before', 'days_before', 'anytime', 'none'];
  if (!validTypes.includes(policy.type)) return false;
  
  if (policy.type === 'hours_before' || policy.type === 'days_before') {
    if (!Number.isInteger(policy.value) || policy.value <= 0) return false;
    if (policy.type === 'hours_before' && policy.value > 72) return false; // Max 72 hours
    if (policy.type === 'days_before' && policy.value > 30) return false; // Max 30 days
  }
  
  if (typeof policy.refundPercentage !== 'number' || 
      policy.refundPercentage < 0 || 
      policy.refundPercentage > 100) {
    return false;
  }
  
  return true;
};

const validateReschedulingPolicy = (policy) => {
  if (!policy) return false;
  
  const validTypes = ['hours_before', 'days_before', 'anytime', 'none'];
  if (!validTypes.includes(policy.type)) return false;
  
  if (policy.type === 'hours_before' || policy.type === 'days_before') {
    if (!Number.isInteger(policy.value) || policy.value <= 0) return false;
    if (policy.type === 'hours_before' && policy.value > 72) return false; // Max 72 hours
    if (policy.type === 'days_before' && policy.value > 30) return false; // Max 30 days
  }
  
  return true;
};

const validateBookingWindow = (window) => {
  if (!window) return false;
  
  if (!Number.isInteger(window.minDays) || 
      !Number.isInteger(window.maxDays) || 
      window.minDays < 0 || 
      window.maxDays <= window.minDays || 
      window.maxDays > 365) { // Max 1 year
    return false;
  }
  
  return true;
};

const validateAppointmentSettings = (settings) => {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Appointment settings must be an object');
    return errors;
  }

  // Validate default duration
  if (settings.defaultDuration !== undefined) {
    if (!validateDuration(settings.defaultDuration)) {
      errors.push('Default duration must be a positive integer between 1 and 480 minutes');
    }
  }

  // Validate buffer time
  if (settings.bufferTime !== undefined) {
    if (!validateBuffer(settings.bufferTime)) {
      errors.push('Buffer time must be a non-negative integer between 0 and 60 minutes');
    }
  }

  // Validate cancellation policy
  if (settings.cancellationPolicy !== undefined) {
    if (!validateCancellationPolicy(settings.cancellationPolicy)) {
      errors.push('Invalid cancellation policy configuration');
    }
  }

  // Validate rescheduling policy
  if (settings.reschedulingPolicy !== undefined) {
    if (!validateReschedulingPolicy(settings.reschedulingPolicy)) {
      errors.push('Invalid rescheduling policy configuration');
    }
  }

  // Validate booking window
  if (settings.bookingWindow !== undefined) {
    if (!validateBookingWindow(settings.bookingWindow)) {
      errors.push('Invalid booking window configuration');
    }
  }

  // Validate concurrent appointments
  if (settings.maxConcurrentAppointments !== undefined) {
    if (!Number.isInteger(settings.maxConcurrentAppointments) || 
        settings.maxConcurrentAppointments < 1 || 
        settings.maxConcurrentAppointments > 10) {
      errors.push('Maximum concurrent appointments must be an integer between 1 and 10');
    }
  }

  // Validate multiple services
  if (settings.allowMultipleServices !== undefined) {
    if (typeof settings.allowMultipleServices !== 'boolean') {
      errors.push('Allow multiple services must be a boolean');
    }
  }

  // Validate deposit required
  if (settings.requireDeposit !== undefined) {
    if (typeof settings.requireDeposit !== 'boolean') {
      errors.push('Require deposit must be a boolean');
    }
  }

  // Validate deposit amount
  if (settings.depositAmount !== undefined) {
    if (typeof settings.depositAmount !== 'number' || 
        settings.depositAmount < 0 || 
        settings.depositAmount > 100) {
      errors.push('Deposit amount must be a percentage between 0 and 100');
    }
  }

  // Validate reminder settings
  if (settings.reminders !== undefined) {
    if (!Array.isArray(settings.reminders)) {
      errors.push('Reminders must be an array');
    } else {
      settings.reminders.forEach((reminder, index) => {
        if (!reminder.type || !['email', 'sms', 'push'].includes(reminder.type)) {
          errors.push(`Invalid reminder type at index ${index}`);
        }
        if (!Number.isInteger(reminder.minutesBefore) || 
            reminder.minutesBefore <= 0 || 
            reminder.minutesBefore > 10080) { // Max 1 week
          errors.push(`Invalid reminder time at index ${index}`);
        }
      });
    }
  }

  return errors;
};

module.exports = {
  validateAppointmentSettings
}; 