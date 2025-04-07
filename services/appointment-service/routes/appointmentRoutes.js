const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Appointment Routes
 */

// Middleware to check if the user has access to a specific tenant
const tenantAccessMiddleware = async (req, res, next) => {
  // This would check if the authenticated user has access to the requested tenant
  // For now, we'll just pass through
  next();
};

/**
 * @route   GET /api/salons/:tenantId/appointments
 * @desc    Get all appointments for a tenant with pagination and filtering
 * @access  Private
 */
router.get(
  '/salons/:tenantId/appointments',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required')
  ],
  appointmentController.getAppointments
);

/**
 * @route   GET /api/appointments/:appointmentId
 * @desc    Get a specific appointment by ID
 * @access  Private
 */
router.get(
  '/appointments/:appointmentId',
  [
    authMiddleware,
    param('appointmentId').notEmpty().withMessage('Appointment ID is required')
  ],
  appointmentController.getAppointmentById
);

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Private
 */
router.post(
  '/appointments',
  [
    authMiddleware,
    body('tenantId').notEmpty().withMessage('Tenant ID is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('stylistId').notEmpty().withMessage('Stylist ID is required'),
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('date').notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('startTime').notEmpty().withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('duration').isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('additionalServices').optional().isArray(),
    body('additionalServices.*.serviceId').optional().notEmpty().withMessage('Service ID is required for additional services'),
    body('additionalServices.*.price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('additionalServices.*.duration').optional().isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters')
  ],
  appointmentController.createAppointment
);

/**
 * @route   POST /api/appointments/recurring
 * @desc    Create a recurring appointment series
 * @access  Private
 */
router.post(
  '/appointments/recurring',
  [
    authMiddleware,
    body('tenantId').notEmpty().withMessage('Tenant ID is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('stylistId').notEmpty().withMessage('Stylist ID is required'),
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('recurrence').notEmpty().withMessage('Recurrence pattern is required'),
    body('recurrence.type').isIn(['daily', 'weekly', 'monthly']).withMessage('Recurrence type must be daily, weekly, or monthly'),
    body('recurrence.frequency').isInt({ min: 1, max: 12 }).withMessage('Frequency must be between 1 and 12'),
    body('recurrence.startDate').notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('recurrence.endDate').optional()
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('recurrence.occurrences').optional()
      .isInt({ min: 1, max: 52 }).withMessage('Occurrences must be between 1 and 52'),
    body('recurrence.startTime').notEmpty().withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('recurrence.duration').isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('pricePerAppointment').isFloat({ min: 0 }).withMessage('Price per appointment must be a positive number'),
    body('additionalServices').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters')
  ],
  appointmentController.createRecurringAppointments
);

/**
 * @route   PUT /api/appointments/:appointmentId
 * @desc    Update an existing appointment
 * @access  Private
 */
router.put(
  '/appointments/:appointmentId',
  [
    authMiddleware,
    param('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('serviceId').optional().notEmpty().withMessage('Service ID cannot be empty if provided'),
    body('date').optional().isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('startTime').optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('duration').optional().isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('totalPrice').optional().isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
      .withMessage('Invalid status'),
    body('additionalServices').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters')
  ],
  appointmentController.updateAppointment
);

/**
 * @route   PUT /api/appointments/:appointmentId/reschedule
 * @desc    Reschedule an appointment
 * @access  Private
 */
router.put(
  '/appointments/:appointmentId/reschedule',
  [
    authMiddleware,
    param('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('date').notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('startTime').notEmpty().withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('duration').optional().isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
  ],
  appointmentController.rescheduleAppointment
);

/**
 * @route   PUT /api/appointments/:appointmentId/cancel
 * @desc    Cancel an appointment
 * @access  Private
 */
router.put(
  '/appointments/:appointmentId/cancel',
  [
    authMiddleware,
    param('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
    body('cancelledBy').optional().isIn(['client', 'stylist', 'admin', 'system']).withMessage('Invalid cancelled by value'),
    body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be a positive number')
  ],
  appointmentController.cancelAppointment
);

/**
 * @route   DELETE /api/appointments/:appointmentId
 * @desc    Delete an appointment permanently
 * @access  Private (Admin only)
 */
router.delete(
  '/appointments/:appointmentId',
  [
    authMiddleware,
    // Additional middleware to check if user is admin would go here
    param('appointmentId').notEmpty().withMessage('Appointment ID is required')
  ],
  appointmentController.deleteAppointment
);

/**
 * @route   GET /api/salons/:tenantId/availability
 * @desc    Check availability for a specific service, stylist, and date
 * @access  Private
 */
router.get(
  '/salons/:tenantId/availability',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required'),
    query('serviceId').notEmpty().withMessage('Service ID is required'),
    query('date').notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    query('stylistId').optional()
  ],
  appointmentController.checkAvailability
);

module.exports = router;