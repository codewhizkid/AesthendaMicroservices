const express = require('express');
const router = express.Router();

// Mock database for roles
let roles = [];

// Create Role endpoint
router.post('/api/roles', (req, res) => {
  const { name, permissions } = req.body;
  if (!name || !permissions) {
    return res.status(400).json({ error: 'Name and permissions are required' });
  }

  const newRole = {
    id: roles.length + 1, // Simple ID generation
    name,
    permissions
  };

  roles.push(newRole);
  res.status(201).json(newRole);
});

module.exports = router;
