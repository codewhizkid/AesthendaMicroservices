const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const RecurringSeries = require('../models/RecurringSeries');

/**
 * Appointment Controller
 */
const appointmentController = {
  /**
   * Get all appointments for a tenant
   * @route GET /api/salons/:tenantId/appointments
   */
  getAppointments: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { tenantId } = req.params;
      const { 
        status, 
        date, 
        startDate, 
        endDate, 
        clientId, 
        stylistId, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      // Build query
      const query = { tenantId };
      
      if (status) {
        query.status = status;
      }
      
      if (date) {
        query.date = new Date(date);
      } else if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      if (clientId) {
        query.clientId = clientId;
      }
      
      if (stylistId) {
        query.stylistId = stylistId;
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Find appointments
      const appointments = await Appointment.find(query)
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count for pagination
      const totalAppointments = await Appointment.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        appointments,
        pagination: {
          total: totalAppointments,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalAppointments / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments',
        details: error.message
      });
    }
  },
  
  /**
   * Get a specific appointment by ID
   * @route GET /api/appointments/:appointmentId
   */
  getAppointmentById: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { appointmentId } = req.params;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Create a new appointment
   * @route POST /api/appointments
   */
  createAppointment: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const appointmentData = req.body;
      
      // Calculate end time based on start time and duration
      const [startHour, startMinute] = appointmentData.startTime.split(':').map(Number);
      const totalMinutes = startHour * 60 + startMinute + appointmentData.duration;
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMinute = totalMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Check for overlapping appointments
      const overlappingAppointments = await Appointment.findOverlappingAppointments(
        appointmentData.tenantId,
        appointmentData.stylistId,
        appointmentData.date,
        appointmentData.startTime,
        endTime
      );
      
      if (overlappingAppointments.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Time slot is already booked',
          overlappingAppointments
        });
      }
      
      // Create new appointment
      const newAppointment = new Appointment({
        ...appointmentData,
        endTime
      });
      
      // Save to database
      await newAppointment.save();
      
      return res.status(201).json({
        success: true,
        appointment: newAppointment
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Create a recurring appointment series
   * @route POST /api/appointments/recurring
   */
  createRecurringAppointments: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const seriesData = req.body;
      
      // Create new recurring series
      const newSeries = new RecurringSeries(seriesData);
      
      // Generate appointment objects
      const appointmentObjects = newSeries.generateAppointments();
      
      // Create appointments
      const createdAppointments = [];
      for (const appointmentData of appointmentObjects) {
        const appointment = new Appointment(appointmentData);
        await appointment.save();
        createdAppointments.push(appointment);
      }
      
      // Update series with created appointment IDs
      newSeries.appointments = createdAppointments.map(app => app._id);
      await newSeries.save();
      
      return res.status(201).json({
        success: true,
        recurringSeries: newSeries,
        appointments: createdAppointments
      });
    } catch (error) {
      console.error('Error creating recurring appointments:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create recurring appointments',
        details: error.message
      });
    }
  },
  
  /**
   * Update an existing appointment
   * @route PUT /api/appointments/:appointmentId
   */
  updateAppointment: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { appointmentId } = req.params;
      const updateData = req.body;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      // Check if time is being updated and calculate new end time
      if (updateData.startTime || updateData.duration) {
        const startTime = updateData.startTime || appointment.startTime;
        const duration = updateData.duration || appointment.duration;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const totalMinutes = startHour * 60 + startMinute + duration;
        const endHour = Math.floor(totalMinutes / 60) % 24;
        const endMinute = totalMinutes % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        updateData.endTime = endTime;
        
        // Check for overlapping appointments if date or time changed
        if (updateData.date || updateData.startTime) {
          const date = updateData.date || appointment.date;
          const overlappingAppointments = await Appointment.findOverlappingAppointments(
            appointment.tenantId,
            updateData.stylistId || appointment.stylistId,
            date,
            startTime,
            endTime,
            appointmentId
          );
          
          if (overlappingAppointments.length > 0) {
            return res.status(409).json({
              success: false,
              error: 'Time slot is already booked',
              overlappingAppointments
            });
          }
        }
      }
      
      // Update appointment fields
      Object.keys(updateData).forEach(key => {
        appointment[key] = updateData[key];
      });
      
      // Save changes
      await appointment.save();
      
      return res.status(200).json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Reschedule an appointment
   * @route PUT /api/appointments/:appointmentId/reschedule
   */
  rescheduleAppointment: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { appointmentId } = req.params;
      const { date, startTime, duration, notes } = req.body;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      // Cannot reschedule completed or cancelled appointments
      if (['completed', 'cancelled', 'no-show'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot reschedule an appointment with status: ${appointment.status}`
        });
      }
      
      // Calculate end time based on start time and duration
      const newDuration = duration || appointment.duration;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const totalMinutes = startHour * 60 + startMinute + newDuration;
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMinute = totalMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Check for overlapping appointments
      const overlappingAppointments = await Appointment.findOverlappingAppointments(
        appointment.tenantId,
        appointment.stylistId,
        date,
        startTime,
        endTime,
        appointmentId
      );
      
      if (overlappingAppointments.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Time slot is already booked',
          overlappingAppointments
        });
      }
      
      // Update appointment
      appointment.date = new Date(date);
      appointment.startTime = startTime;
      appointment.endTime = endTime;
      
      if (duration) {
        appointment.duration = duration;
      }
      
      if (notes) {
        appointment.notes = appointment.notes 
          ? `${appointment.notes}\n\n[Rescheduled] ${notes}`
          : `[Rescheduled] ${notes}`;
      }
      
      // Save changes
      await appointment.save();
      
      return res.status(200).json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reschedule appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Cancel an appointment
   * @route PUT /api/appointments/:appointmentId/cancel
   */
  cancelAppointment: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { appointmentId } = req.params;
      const { reason, cancelledBy, refundAmount } = req.body;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      // Cannot cancel completed appointments
      if (['completed', 'no-show'].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel an appointment with status: ${appointment.status}`
        });
      }
      
      // Update appointment
      appointment.status = 'cancelled';
      appointment.cancellation = {
        reason: reason || 'No reason provided',
        cancelledBy: cancelledBy || 'system',
        cancelledAt: new Date(),
        refundAmount: refundAmount || 0
      };
      
      // Save changes
      await appointment.save();
      
      return res.status(200).json({
        success: true,
        appointment
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Delete an appointment permanently
   * @route DELETE /api/appointments/:appointmentId
   */
  deleteAppointment: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { appointmentId } = req.params;
      
      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      // Delete the appointment
      await appointment.remove();
      
      return res.status(200).json({
        success: true,
        message: 'Appointment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete appointment',
        details: error.message
      });
    }
  },
  
  /**
   * Check availability for a specific service, stylist, and date
   * @route GET /api/salons/:tenantId/availability
   */
  checkAvailability: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { tenantId } = req.params;
      const { serviceId, date, stylistId } = req.query;
      
      // For demo purposes, we'll use fixed business hours
      // In a real application, this would be fetched from a database
      const businessHours = [
        { day: 0, isOpen: false }, // Sunday
        { day: 1, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Monday
        { day: 2, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Tuesday
        { day: 3, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Wednesday
        { day: 4, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Thursday
        { day: 5, isOpen: true, openTime: '09:00', closeTime: '18:00' }, // Friday
        { day: 6, isOpen: false } // Saturday
      ];
      
      // For demo purposes, we'll use a fixed service duration
      // In a real application, this would be fetched from a database
      const serviceDuration = 60; // 60 minutes
      
      // Find available time slots
      const availableSlots = await Appointment.findAvailableTimeSlots(
        tenantId,
        stylistId,
        date,
        serviceDuration,
        businessHours
      );
      
      return res.status(200).json({
        success: true,
        date,
        stylistId: stylistId || 'any',
        serviceId,
        availableSlots
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check availability',
        details: error.message
      });
    }
  }
};

module.exports = appointmentController;