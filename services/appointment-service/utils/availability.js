const moment = require('moment');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Stylist = require('../models/Stylist');

/**
 * Convert time string to minutes since midnight
 * @param {string} time - Time in HH:mm format
 * @returns {number} Minutes since midnight
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:mm format
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Check if a time slot overlaps with existing appointments
 * @param {Array} appointments - List of existing appointments
 * @param {string} startTime - Start time to check
 * @param {number} duration - Duration in minutes
 * @returns {boolean} Whether the slot overlaps
 */
const hasOverlap = (appointments, startTime, duration) => {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = slotStart + duration;

  return appointments.some(appointment => {
    const appointmentStart = timeToMinutes(appointment.startTime);
    const appointmentEnd = appointmentStart + appointment.duration;
    return slotStart < appointmentEnd && slotEnd > appointmentStart;
  });
};

/**
 * Check availability and return available time slots
 * @param {string} tenantId - Tenant ID
 * @param {string} date - Date to check (YYYY-MM-DD)
 * @param {Array<string>} serviceIds - Service IDs
 * @param {string} [stylistId] - Optional stylist ID
 * @param {string} [excludeAppointmentId] - Optional appointment ID to exclude
 * @returns {Promise<Array<string>>} Available time slots
 */
const checkAvailability = async (tenantId, date, serviceIds, stylistId, excludeAppointmentId = null) => {
  try {
    // Get services to calculate total duration
    const services = await Service.find({
      _id: { $in: serviceIds },
      tenantId
    });

    if (!services.length) {
      throw new Error('No services found');
    }

    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);

    // Get stylist(s) to check
    let stylists;
    if (stylistId) {
      const stylist = await Stylist.findOne({ _id: stylistId, tenantId });
      if (!stylist) {
        throw new Error('Stylist not found');
      }
      stylists = [stylist];
    } else {
      // Get all stylists who can perform these services
      stylists = await Stylist.find({
        tenantId,
        specialties: { $in: services.map(s => s.name) }
      });
    }

    if (!stylists.length) {
      throw new Error('No available stylists found');
    }

    // Get the day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = moment(date).day();

    // Get existing appointments for the date
    const query = {
      tenantId,
      date: moment(date).startOf('day').toDate(),
      status: { $nin: ['CANCELLED', 'NO_SHOW'] }
    };

    if (stylistId) {
      query.stylistId = stylistId;
    } else {
      query.stylistId = { $in: stylists.map(s => s._id) };
    }

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await Appointment.find(query);

    // Generate available time slots
    const availableSlots = new Set();
    const slotInterval = 15; // 15-minute intervals

    for (const stylist of stylists) {
      // Get stylist's availability for the day
      const dayAvailability = stylist.availability.find(a => a.dayOfWeek === dayOfWeek);
      
      if (!dayAvailability) {
        continue; // Stylist doesn't work on this day
      }

      const startMinutes = timeToMinutes(dayAvailability.startTime);
      const endMinutes = timeToMinutes(dayAvailability.endTime);

      // Generate slots
      for (let slotStart = startMinutes; slotStart <= endMinutes - totalDuration; slotStart += slotInterval) {
        const startTime = minutesToTime(slotStart);
        
        // Check if slot overlaps with stylist's existing appointments
        const stylistAppointments = existingAppointments.filter(a => 
          a.stylistId.toString() === stylist._id.toString()
        );

        if (!hasOverlap(stylistAppointments, startTime, totalDuration)) {
          availableSlots.add(startTime);
        }
      }
    }

    // Convert to sorted array
    return Array.from(availableSlots).sort();
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

module.exports = {
  checkAvailability,
  timeToMinutes,
  minutesToTime,
  hasOverlap
}; 