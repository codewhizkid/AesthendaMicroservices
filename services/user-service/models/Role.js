const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  permissions: {
    type: [String],
    default: []
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isCustom: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique role names within each tenant
RoleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt timestamp
RoleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to create default roles for a new tenant
RoleSchema.statics.createDefaultRoles = async function(tenantId, adminUserId) {
  const defaultRoles = [
    {
      name: 'Salon Admin',
      description: 'Full administrative access to the salon',
      permissions: [
        'manage_staff',
        'manage_services',
        'manage_appointments',
        'view_reports',
        'manage_clients',
        'manage_settings',
        'manage_billing'
      ],
      isDefault: true,
      isCustom: false
    },
    {
      name: 'Stylist',
      description: 'Standard stylist role with appointment management',
      permissions: [
        'view_own_schedule',
        'view_assigned_clients',
        'update_appointment_status',
        'view_service_catalog'
      ],
      isDefault: true,
      isCustom: false
    },
    {
      name: 'Front Desk',
      description: 'Reception staff with booking capabilities',
      permissions: [
        'manage_appointments',
        'view_schedule',
        'view_clients',
        'create_clients'
      ],
      isDefault: true,
      isCustom: false
    }
  ];

  const roles = defaultRoles.map(role => ({
    ...role,
    tenantId,
    createdBy: adminUserId
  }));

  return this.insertMany(roles);
};

// Method to get all available permissions
RoleSchema.statics.getAllPermissions = function() {
  return [
    // Staff Management
    'manage_staff',
    'view_staff',
    'create_staff',
    'edit_staff',
    'delete_staff',
    
    // Service Management
    'manage_services',
    'view_service_catalog',
    'create_service',
    'edit_service',
    'delete_service',
    
    // Appointment Management
    'manage_appointments',
    'view_schedule',
    'view_own_schedule',
    'create_appointment',
    'edit_appointment',
    'delete_appointment',
    'update_appointment_status',
    
    // Client Management
    'manage_clients',
    'view_clients',
    'view_assigned_clients',
    'create_clients',
    'edit_clients',
    'delete_clients',
    
    // Reporting
    'view_reports',
    'view_financial_reports',
    'view_staff_performance',
    
    // Settings
    'manage_settings',
    'edit_business_hours',
    'edit_notification_settings',
    
    // Billing & Subscription
    'manage_billing',
    'view_invoices',
    'update_payment_method'
  ];
};

module.exports = mongoose.model('Role', RoleSchema); 