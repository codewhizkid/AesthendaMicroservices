const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('./middleware/authMiddleware');

// Mock database for roles
let roles = [];
// Mock database for staff
let staff = [];

// Middleware to ensure the user is authenticated
const requireAuth = (req, res, next) => {
  const user = authenticateToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  next();
};

// Middleware to ensure the user has admin role
const requireAdmin = (req, res, next) => {
  if (!checkRole(req.user, ['admin', 'salon_admin', 'system_admin'])) {
    return res.status(403).json({ error: 'Forbidden: Requires admin role' });
  }
  next();
};

// List Roles endpoint
router.get('/api/roles', requireAuth, requireAdmin, (req, res) => {
  // Filter roles by tenant ID if present in the user token
  let filteredRoles = roles;
  if (req.user.tenantId) {
    filteredRoles = roles.filter(role => !role.tenantId || role.tenantId === req.user.tenantId);
  }
  res.json(filteredRoles);
});

// Create Role endpoint
router.post('/api/roles', requireAuth, requireAdmin, (req, res) => {
  const { name, permissions } = req.body;
  if (!name || !permissions) {
    return res.status(400).json({ error: 'Name and permissions are required' });
  }

  const newRole = {
    id: roles.length + 1, // Simple ID generation
    name,
    permissions,
    tenantId: req.user.tenantId // Associate with the current tenant
  };

  roles.push(newRole);
  res.status(201).json(newRole);
});

// Edit Role endpoint
router.put('/api/roles/:roleId', requireAuth, requireAdmin, (req, res) => {
  const roleId = parseInt(req.params.roleId);
  const { name, permissions } = req.body;
  
  if (!name || !permissions) {
    return res.status(400).json({ error: 'Name and permissions are required' });
  }

  const roleIndex = roles.findIndex(role => 
    role.id === roleId && 
    (!role.tenantId || role.tenantId === req.user.tenantId)
  );

  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  // Update the role
  const updatedRole = {
    ...roles[roleIndex],
    name,
    permissions
  };

  roles[roleIndex] = updatedRole;
  res.json(updatedRole);
});

// Delete Role endpoint
router.delete('/api/roles/:roleId', requireAuth, requireAdmin, (req, res) => {
  const roleId = parseInt(req.params.roleId);
  
  const roleIndex = roles.findIndex(role => 
    role.id === roleId && 
    (!role.tenantId || role.tenantId === req.user.tenantId)
  );

  if (roleIndex === -1) {
    return res.status(404).json({ error: 'Role not found' });
  }

  // Remove the role
  roles.splice(roleIndex, 1);
  res.status(204).send();
});

// List Staff endpoint
router.get('/api/staff', requireAuth, requireAdmin, (req, res) => {
  // Filter staff by tenant ID if present
  let filteredStaff = staff;
  if (req.user.tenantId) {
    filteredStaff = staff.filter(member => !member.tenantId || member.tenantId === req.user.tenantId);
  }
  res.json(filteredStaff);
});

// Assign Role to Staff endpoint
router.post('/api/staff/:staffId/roles', requireAuth, requireAdmin, (req, res) => {
  const staffId = parseInt(req.params.staffId);
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'Role ID is required' });
  }

  const staffIndex = staff.findIndex(member => 
    member.id === staffId && 
    (!member.tenantId || member.tenantId === req.user.tenantId)
  );

  if (staffIndex === -1) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const role = roles.find(role => 
    role.id === roleId && 
    (!role.tenantId || role.tenantId === req.user.tenantId)
  );

  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  // Assign role to staff
  staff[staffIndex].roleId = roleId;
  res.json(staff[staffIndex]);
});

module.exports = router;
