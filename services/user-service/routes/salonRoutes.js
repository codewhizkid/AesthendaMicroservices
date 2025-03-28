const express = require('express');
const router = express.Router();
const salonController = require('../controllers/salonController');
const { authorize } = require('../middleware/authMiddleware');

// Middleware to check if user is authenticated and has required role
const requireAuth = (roles = []) => [
  authorize, 
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  }
];

// Define admin roles that can modify salon settings
const adminRoles = ['salon_admin', 'system_admin'];

// Get salon information by tenantId
router.get(
  '/salons/:tenantId',
  requireAuth(['salon_admin', 'salon_staff', 'system_admin']),
  salonController.getSalonInfo
);

// Update basic salon information
router.put(
  '/salons/:tenantId',
  requireAuth(adminRoles),
  salonController.updateSalonInfo
);

// Update salon branding settings
router.put(
  '/salons/:tenantId/branding',
  requireAuth(adminRoles),
  salonController.updateBranding
);

// Update business hours
router.put(
  '/salons/:tenantId/business-hours',
  requireAuth(adminRoles),
  salonController.updateBusinessHours
);

// Update booking page configuration
router.put(
  '/salons/:tenantId/booking-config',
  requireAuth(adminRoles),
  salonController.updateBookingPageConfig
);

// Public endpoint to get salon by booking page slug
router.get(
  '/public/salons/by-slug/:slug',
  salonController.getSalonBySlug
);

module.exports = router; 