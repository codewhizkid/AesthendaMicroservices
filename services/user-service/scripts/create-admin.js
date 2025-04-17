/**
 * Script to create an admin user
 * Run with: node scripts/create-admin.js
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

// Default admin details (can be overridden with environment variables)
const adminEmail = process.env.ADMIN_EMAIL || 'admin@aesthenda.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const adminFirstName = process.env.ADMIN_FIRST_NAME || 'System';
const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';
const tenantId = process.env.TENANT_ID || 'system';

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service';
    await mongoose.connect(mongoUrl);
    
    console.log('Connected to MongoDB...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      
      // Update to system_admin role if not already
      if (existingAdmin.role !== 'system_admin') {
        await User.findByIdAndUpdate(existingAdmin._id, { 
          role: 'system_admin',
          tenantId: tenantId
        });
        console.log('Updated existing user to system_admin role.');
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        password: adminPassword,
        role: 'system_admin',
        tenantId: tenantId,
        isActive: true
      });
      
      await adminUser.save();
      console.log(`Admin user created with email: ${adminEmail}`);
      console.log('Password:', adminPassword);
    }
    
    console.log('Admin user creation completed.');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin(); 