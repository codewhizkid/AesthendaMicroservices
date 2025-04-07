const express = require('express');
const router = express.Router();
const waitlistController = require('../controllers/waitlistController');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Waitlist Routes
 */

// Middleware to check if the user has access to a specific tenant
const tenantAccessMiddleware = async (req, res, next) => {
  // This would check if the authenticated user has access to the requested tenant
  // For now, we'll just pass through
  next();
};

/**
 * @route   GET /api/salons/:tenantId/waitlist
 * @desc    Get all waitlist entries for a tenant with pagination and filtering
 * @access  Private
 */
router.get(
  '/salons/:tenantId/waitlist',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required')
  ],
  waitlistController.getWaitlist
);

/**
 * @route   GET /api/waitlist/:waitlistId
 * @desc    Get a specific waitlist entry by ID
 * @access  Private
 */
router.get(
  '/waitlist/:waitlistId',
  [
    authMiddleware,
    param('waitlistId').notEmpty().withMessage('Waitlist entry ID is required')
  ],
  waitlistController.getWaitlistEntryById
);

/**
 * @route   POST /api/salons/:tenantId/waitlist
 * @desc    Add a client to the waitlist
 * @access  Private
 */
router.post(
  '/salons/:tenantId/waitlist',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('preferredDateRange').notEmpty().withMessage('Preferred date range is required'),
    body('preferredDateRange.startDate').notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('preferredDateRange.endDate').notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('preferredTimeRange').notEmpty().withMessage('Preferred time range is required'),
    body('preferredTimeRange.startTime').notEmpty().withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('preferredTimeRange.endTime').notEmpty().withMessage('End time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('additionalServices').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters'),
    body('contactPreferences').optional().isObject(),
    body('contactPreferences.method').optional().isIn(['email', 'sms', 'both']).withMessage('Contact method must be email, sms, or both'),
    body('availableUntil').optional().isISO8601().withMessage('Invalid date format, use YYYY-MM-DD')
  ],
  waitlistController.addToWaitlist
);

/**
 * @route   PUT /api/waitlist/:waitlistId
 * @desc    Update a waitlist entry
 * @access  Private
 */
router.put(
  '/waitlist/:waitlistId',
  [
    authMiddleware,
    param('waitlistId').notEmpty().withMessage('Waitlist entry ID is required'),
    body('stylistId').optional(),
    body('serviceId').optional().notEmpty().withMessage('Service ID cannot be empty if provided'),
    body('preferredDateRange').optional(),
    body('preferredDateRange.startDate').optional().isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('preferredDateRange.endDate').optional().isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('preferredTimeRange').optional(),
    body('preferredTimeRange.startTime').optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('preferredTimeRange.endTime').optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
    body('status').optional().isIn(['active', 'notified', 'booked', 'expired', 'cancelled']).withMessage('Invalid status'),
    body('additionalServices').optional().isArray(),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters'),
    body('contactPreferences').optional().isObject(),
    body('availableUntil').optional().isISO8601().withMessage('Invalid date format, use YYYY-MM-DD')
  ],
  waitlistController.updateWaitlist
);

/**
 * @route   DELETE /api/salons/:tenantId/waitlist/:waitlistId
 * @desc    Remove a client from the waitlist
 * @access  Private
 */
router.delete(
  '/salons/:tenantId/waitlist/:waitlistId',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required'),
    param('waitlistId').notEmpty().withMessage('Waitlist entry ID is required')
  ],
  waitlistController.removeFromWaitlist
);

/**
 * @route   POST /api/waitlist/:waitlistId/book
 * @desc    Convert a waitlist entry to an appointment
 * @access  Private
 */
router.post(
  '/waitlist/:waitlistId/book',
  [
    authMiddleware,
    param('waitlistId').notEmpty().withMessage('Waitlist entry ID is required'),
    body('date').notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('startTime').notEmpty().withMessage('Start time is required')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format, use HH:MM (24-hour format)'),
    body('duration').optional().isInt({ min: 5, max: 480 }).withMessage('Duration must be between 5 and 480 minutes'),
    body('totalPrice').optional().isFloat({ min: 0 }).withMessage('Total price must be a positive number'),
    body('internalNotes').optional().isString().isLength({ max: 1000 }).withMessage('Internal notes cannot exceed 1000 characters')
  ],
  waitlistController.bookFromWaitlist
);

/**
 * @route   POST /api/salons/:tenantId/waitlist/notify
 * @desc    Notify clients on the waitlist about availability
 * @access  Private
 */
router.post(
  '/salons/:tenantId/waitlist/notify',
  [
    authMiddleware,
    tenantAccessMiddleware,
    param('tenantId').notEmpty().withMessage('Tenant ID is required'),
    body('serviceId').notEmpty().withMessage('Service ID is required'),
    body('date').notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD'),
    body('stylistId').optional()
  ],
  waitlistController.notifyWaitlistClients
);

module.exports = router;