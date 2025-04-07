const { validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const Appointment = require('../models/Appointment');

/**
 * Waitlist Controller
 */
const waitlistController = {
  /**
   * Get all waitlist entries for a tenant
   * @route GET /api/salons/:tenantId/waitlist
   */
  getWaitlist: async (req, res) => {
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
      const { status, serviceId, stylistId, page = 1, limit = 10 } = req.query;
      
      // Build query
      const query = { tenantId };
      
      if (status) {
        query.status = status;
      }
      
      if (serviceId) {
        query.serviceId = serviceId;
      }
      
      if (stylistId) {
        query.stylistId = stylistId;
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Find waitlist entries
      const waitlist = await Waitlist.find(query)
        .sort({ priority: -1, createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get total count for pagination
      const totalEntries = await Waitlist.countDocuments(query);
      
      return res.status(200).json({
        success: true,
        waitlist,
        pagination: {
          total: totalEntries,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalEntries / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch waitlist',
        details: error.message
      });
    }
  },
  
  /**
   * Get a specific waitlist entry by ID
   * @route GET /api/waitlist/:waitlistId
   */
  getWaitlistEntryById: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { waitlistId } = req.params;
      
      // Find the waitlist entry
      const waitlistEntry = await Waitlist.findById(waitlistId);
      
      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,
          error: 'Waitlist entry not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        waitlistEntry
      });
    } catch (error) {
      console.error('Error fetching waitlist entry:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch waitlist entry',
        details: error.message
      });
    }
  },
  
  /**
   * Add a client to the waitlist
   * @route POST /api/salons/:tenantId/waitlist
   */
  addToWaitlist: async (req, res) => {
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
      const waitlistData = req.body;
      
      // Create new waitlist entry
      const newWaitlistEntry = new Waitlist({
        tenantId,
        ...waitlistData
      });
      
      // Save to database
      await newWaitlistEntry.save();
      
      return res.status(201).json({
        success: true,
        waitlistEntry: newWaitlistEntry
      });
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add to waitlist',
        details: error.message
      });
    }
  },
  
  /**
   * Update a waitlist entry
   * @route PUT /api/waitlist/:waitlistId
   */
  updateWaitlist: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { waitlistId } = req.params;
      const updateData = req.body;
      
      // Find and update the waitlist entry
      const waitlistEntry = await Waitlist.findById(waitlistId);
      
      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,
          error: 'Waitlist entry not found'
        });
      }
      
      // Cannot update if already booked
      if (waitlistEntry.status === 'booked' && updateData.status !== 'booked') {
        return res.status(400).json({
          success: false,
          error: 'Cannot update a waitlist entry that has already been booked'
        });
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        waitlistEntry[key] = updateData[key];
      });
      
      // Save changes
      await waitlistEntry.save();
      
      return res.status(200).json({
        success: true,
        waitlistEntry
      });
    } catch (error) {
      console.error('Error updating waitlist entry:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update waitlist entry',
        details: error.message
      });
    }
  },
  
  /**
   * Remove a client from the waitlist
   * @route DELETE /api/salons/:tenantId/waitlist/:waitlistId
   */
  removeFromWaitlist: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { tenantId, waitlistId } = req.params;
      
      // Find the waitlist entry
      const waitlistEntry = await Waitlist.findOne({ 
        _id: waitlistId, 
        tenantId 
      });
      
      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,
          error: 'Waitlist entry not found'
        });
      }
      
      // Cannot remove if already booked
      if (waitlistEntry.status === 'booked') {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove a waitlist entry that has already been booked'
        });
      }
      
      // Remove the entry
      await waitlistEntry.remove();
      
      return res.status(200).json({
        success: true,
        message: 'Waitlist entry removed successfully'
      });
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to remove from waitlist',
        details: error.message
      });
    }
  },
  
  /**
   * Convert a waitlist entry to an appointment
   * @route POST /api/waitlist/:waitlistId/book
   */
  bookFromWaitlist: async (req, res) => {
    try {
      // Extract validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      const { waitlistId } = req.params;
      const { date, startTime, duration, totalPrice } = req.body;
      
      // Find the waitlist entry
      const waitlistEntry = await Waitlist.findById(waitlistId);
      
      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,
          error: 'Waitlist entry not found'
        });
      }
      
      // Cannot book if already booked
      if (waitlistEntry.status === 'booked') {
        return res.status(400).json({
          success: false,
          error: 'Waitlist entry has already been booked'
        });
      }
      
      // Calculate end time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const totalMinutes = startHour * 60 + startMinute + (duration || 60);
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMinute = totalMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Check for overlapping appointments
      const overlappingAppointments = await Appointment.findOverlappingAppointments(
        waitlistEntry.tenantId,
        waitlistEntry.stylistId,
        date,
        startTime,
        endTime
      );
      
      if (overlappingAppointments.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Time slot is no longer available',
          overlappingAppointments
        });
      }
      
      // Create new appointment
      const newAppointment = new Appointment({
        tenantId: waitlistEntry.tenantId,
        clientId: waitlistEntry.clientId,
        stylistId: waitlistEntry.stylistId,
        serviceId: waitlistEntry.serviceId,
        additionalServices: waitlistEntry.additionalServices || [],
        date: new Date(date),
        startTime,
        endTime,
        duration: duration || 60,
        status: 'scheduled',
        totalPrice: totalPrice || 0,
        notes: waitlistEntry.notes,
        internalNotes: waitlistEntry.internalNotes
      });
      
      // Save the appointment
      await newAppointment.save();
      
      // Update waitlist entry
      waitlistEntry.status = 'booked';
      waitlistEntry.appointmentId = newAppointment._id;
      await waitlistEntry.save();
      
      return res.status(201).json({
        success: true,
        appointment: newAppointment,
        waitlistEntry
      });
    } catch (error) {
      console.error('Error booking from waitlist:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to book from waitlist',
        details: error.message
      });
    }
  },
  
  /**
   * Notify clients on the waitlist about availability
   * @route POST /api/salons/:tenantId/waitlist/notify
   */
  notifyWaitlistClients: async (req, res) => {
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
      const { serviceId, date, stylistId } = req.body;
      
      // Find eligible clients to notify
      const eligibleClients = await Waitlist.findEligibleClients(
        tenantId,
        serviceId,
        new Date(date),
        stylistId
      );
      
      if (eligibleClients.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No eligible clients found to notify',
          notifiedClients: []
        });
      }
      
      // In a real application, this would send emails/SMS to clients
      const notifiedClients = [];
      
      for (const client of eligibleClients) {
        // Mark as notified
        client.markAsNotified();
        await client.save();
        notifiedClients.push(client);
      }
      
      return res.status(200).json({
        success: true,
        message: `${notifiedClients.length} clients notified successfully`,
        notifiedClients
      });
    } catch (error) {
      console.error('Error notifying waitlist clients:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to notify waitlist clients',
        details: error.message
      });
    }
  }
};

module.exports = waitlistController;