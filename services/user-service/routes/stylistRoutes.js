const express = require('express');
const router = express.Router();
const stylistController = require('../controllers/stylistController');
const { authorize, requireStaff, verifyStylistAccess } = require('../middleware/authMiddleware');

// Apply authorization middleware to all routes
router.use(authorize);

// POST - Create a new stylist (salon_admin or system_admin only)
router.post('/', stylistController.createStylist);

// GET - Retrieve all stylists for a salon
router.get('/', requireStaff, stylistController.getAllStylists);

// GET - Retrieve a stylist by MongoDB ID
router.get('/:id', requireStaff, stylistController.getStylistById);

// GET - Retrieve a stylist by stylist_id
router.get('/employee/:stylist_id', requireStaff, verifyStylistAccess, stylistController.getStylistByStylistId);

// PUT - Update a stylist's information
router.put('/:id', requireStaff, stylistController.updateStylist);

// DELETE - Remove a stylist (soft delete by deactivating)
router.delete('/:id', stylistController.deleteStylist);

module.exports = router;