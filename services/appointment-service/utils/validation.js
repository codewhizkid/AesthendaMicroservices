const moment = require('moment');
const Client = require('../models/Client');
const Service = require('../models/Service');
const Stylist = require('../models/Stylist');

/**
 * Validate appointment input data
 * @param {string} tenantId - Tenant ID
 * @param {Object} input - Appointment input data
 * @returns {Promise<void>}
 * @throws {Error} Validation error
 */
const validateAppointment = async (tenantId, input) => {
  const errors = [];

  // Validate date and time
  if (!moment(input.date, 'YYYY-MM-DD', true).isValid()) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }

  if (!moment(input.startTime, 'HH:mm', true).isValid()) {
    errors.push('Invalid time format. Use HH:mm (24-hour format)');
  }

  // Check if date is in the past
  const appointmentDateTime = moment(`${input.date} ${input.startTime}`);
  if (appointmentDateTime.isBefore(moment())) {
    errors.push('Cannot create appointments in the past');
  }

  // Validate client
  if (input.clientId) {
    const client = await Client.findOne({ _id: input.clientId, tenantId });
    if (!client) {
      errors.push('Client not found');
    }
  }

  // Validate stylist
  if (input.stylistId) {
    const stylist = await Stylist.findOne({ _id: input.stylistId, tenantId });
    if (!stylist) {
      errors.push('Stylist not found');
    }

    // Check if stylist works on this day
    const dayOfWeek = moment(input.date).day();
    const availability = stylist.availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!availability) {
      errors.push('Stylist does not work on this day');
    } else {
      // Check if appointment is within stylist's working hours
      const startMinutes = moment(input.startTime, 'HH:mm').diff(moment().startOf('day'), 'minutes');
      const availStartMinutes = moment(availability.startTime, 'HH:mm').diff(moment().startOf('day'), 'minutes');
      const availEndMinutes = moment(availability.endTime, 'HH:mm').diff(moment().startOf('day'), 'minutes');

      if (startMinutes < availStartMinutes || startMinutes > availEndMinutes) {
        errors.push('Appointment time is outside stylist\'s working hours');
      }
    }
  }

  // Validate services
  if (input.serviceIds && input.serviceIds.length > 0) {
    const services = await Service.find({
      _id: { $in: input.serviceIds },
      tenantId
    });

    if (services.length !== input.serviceIds.length) {
      errors.push('One or more services not found');
    }

    // If stylist is specified, check if they can perform all services
    if (input.stylistId) {
      const stylist = await Stylist.findOne({ _id: input.stylistId, tenantId });
      const cannotPerform = services.filter(service => 
        !stylist.specialties.includes(service.name)
      );

      if (cannotPerform.length > 0) {
        errors.push(`Stylist cannot perform the following services: ${cannotPerform.map(s => s.name).join(', ')}`);
      }
    }
  } else {
    errors.push('At least one service must be selected');
  }

  // Validate notes length
  if (input.notes && input.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters');
  }

  // If there are any validation errors, throw them
  if (errors.length > 0) {
    throw new Error(errors.join('. '));
  }
};

module.exports = {
  validateAppointment
}; 