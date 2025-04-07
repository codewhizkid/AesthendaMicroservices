const validateTemplate = (template) => {
  if (!template || typeof template !== 'object') return false;
  
  // Check required fields
  if (!template.subject || typeof template.subject !== 'string' || template.subject.length === 0) {
    return false;
  }
  
  if (!template.body || typeof template.body !== 'string' || template.body.length === 0) {
    return false;
  }
  
  // Validate template variables
  const validVariables = [
    '{{clientName}}',
    '{{serviceName}}',
    '{{appointmentDate}}',
    '{{appointmentTime}}',
    '{{duration}}',
    '{{stylistName}}',
    '{{salonName}}',
    '{{salonAddress}}',
    '{{salonPhone}}',
    '{{cancellationLink}}',
    '{{rescheduleLink}}',
    '{{confirmationLink}}'
  ];
  
  const templateText = template.subject + template.body;
  const matches = templateText.match(/{{[^}]+}}/g) || [];
  
  return matches.every(match => validVariables.includes(match));
};

const validateProvider = (provider) => {
  if (!provider || typeof provider !== 'object') return false;
  
  // Check required fields
  if (!provider.type || !['email', 'sms', 'push'].includes(provider.type)) {
    return false;
  }
  
  // Validate provider-specific settings
  switch (provider.type) {
    case 'email':
      return (
        provider.from &&
        typeof provider.from === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.from) &&
        provider.replyTo &&
        typeof provider.replyTo === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provider.replyTo)
      );
      
    case 'sms':
      return (
        provider.fromNumber &&
        typeof provider.fromNumber === 'string' &&
        /^\+[1-9]\d{1,14}$/.test(provider.fromNumber)
      );
      
    case 'push':
      return (
        provider.appId &&
        typeof provider.appId === 'string' &&
        provider.appId.length > 0
      );
      
    default:
      return false;
  }
};

const validateNotificationSettings = (settings) => {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Notification settings must be an object');
    return errors;
  }

  // Validate enabled notification types
  if (settings.enabledTypes !== undefined) {
    if (!Array.isArray(settings.enabledTypes)) {
      errors.push('Enabled types must be an array');
    } else {
      const validTypes = ['email', 'sms', 'push'];
      settings.enabledTypes.forEach(type => {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid notification type: ${type}`);
        }
      });
    }
  }

  // Validate providers
  if (settings.providers !== undefined) {
    if (!Array.isArray(settings.providers)) {
      errors.push('Providers must be an array');
    } else {
      settings.providers.forEach((provider, index) => {
        if (!validateProvider(provider)) {
          errors.push(`Invalid provider configuration at index ${index}`);
        }
      });
    }
  }

  // Validate templates
  if (settings.templates !== undefined) {
    if (typeof settings.templates !== 'object') {
      errors.push('Templates must be an object');
    } else {
      const requiredTemplates = [
        'appointmentConfirmation',
        'appointmentReminder',
        'appointmentCancellation',
        'appointmentRescheduled',
        'appointmentFollowUp'
      ];
      
      requiredTemplates.forEach(templateName => {
        if (settings.templates[templateName] !== undefined) {
          if (!validateTemplate(settings.templates[templateName])) {
            errors.push(`Invalid template configuration for ${templateName}`);
          }
        }
      });
    }
  }

  // Validate scheduling settings
  if (settings.scheduling !== undefined) {
    const scheduling = settings.scheduling;
    
    if (typeof scheduling !== 'object') {
      errors.push('Scheduling settings must be an object');
    } else {
      // Validate reminder times
      if (scheduling.reminderTimes !== undefined) {
        if (!Array.isArray(scheduling.reminderTimes)) {
          errors.push('Reminder times must be an array');
        } else {
          scheduling.reminderTimes.forEach((minutes, index) => {
            if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 10080) { // Max 1 week
              errors.push(`Invalid reminder time at index ${index}`);
            }
          });
        }
      }
      
      // Validate follow-up delay
      if (scheduling.followUpDelay !== undefined) {
        if (!Number.isInteger(scheduling.followUpDelay) || 
            scheduling.followUpDelay <= 0 || 
            scheduling.followUpDelay > 10080) { // Max 1 week
          errors.push('Follow-up delay must be a positive integer between 1 and 10080 minutes');
        }
      }
      
      // Validate quiet hours
      if (scheduling.quietHours !== undefined) {
        const { start, end } = scheduling.quietHours;
        if (!start || !end || 
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start) || 
            !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end)) {
          errors.push('Invalid quiet hours format');
        }
      }
    }
  }

  return errors;
};

module.exports = {
  validateNotificationSettings
}; 