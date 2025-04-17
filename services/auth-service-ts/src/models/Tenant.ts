import mongoose from 'mongoose';
import { BaseDocument, createSchema, createModel } from './BaseModel';

/**
 * Tenant document interface
 */
export interface TenantDocument extends BaseDocument {
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  settings: {
    timezone: string;
    businessHours: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
      breaks: Array<{
        startTime: string;
        endTime: string;
        reason: string;
      }>;
    }>;
    holidays: Array<{
      date: Date;
      name: string;
      isRecurring: boolean;
      description: string;
    }>;
    appointmentSettings: {
      minAdvanceTime: number;
      maxAdvanceTime: number;
      defaultDuration: number;
      bufferTime: number;
      allowMultipleServices: boolean;
      maxServicesPerBooking: number;
      cancellationPolicy: {
        minHoursNotice: number;
        cancellationFee: number;
        allowRescheduling: boolean;
        rescheduleLimit: number;
      };
    };
    notificationSettings: {
      enableEmail: boolean;
      enableSMS: boolean;
      enablePush: boolean;
      reminderTimes: number[];
    };
  };
  subscription: {
    plan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
    startDate: Date;
    endDate?: Date;
  };
  contact: {
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
}

/**
 * Tenant schema definition
 */
const tenantSchemaDefinition = {
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Tenant slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    businessHours: [{
      dayOfWeek: Number, // 0 = Sunday, 6 = Saturday
      startTime: String, // HH:mm format
      endTime: String,   // HH:mm format
      isOpen: Boolean,
      breaks: [{
        startTime: String,
        endTime: String,
        reason: String
      }]
    }],
    holidays: [{
      date: Date,
      name: String,
      isRecurring: Boolean,
      description: String
    }],
    appointmentSettings: {
      minAdvanceTime: {
        type: Number,
        default: 1 // hours
      },
      maxAdvanceTime: {
        type: Number,
        default: 30 // days
      },
      defaultDuration: {
        type: Number,
        default: 60 // minutes
      },
      bufferTime: {
        type: Number,
        default: 15 // minutes
      },
      allowMultipleServices: {
        type: Boolean,
        default: true
      },
      maxServicesPerBooking: {
        type: Number,
        default: 3
      },
      cancellationPolicy: {
        minHoursNotice: {
          type: Number,
          default: 24
        },
        cancellationFee: {
          type: Number,
          default: 0
        },
        allowRescheduling: {
          type: Boolean,
          default: true
        },
        rescheduleLimit: {
          type: Number,
          default: 2
        }
      }
    },
    notificationSettings: {
      enableEmail: {
        type: Boolean,
        default: true
      },
      enableSMS: {
        type: Boolean,
        default: true
      },
      enablePush: {
        type: Boolean,
        default: true
      },
      reminderTimes: [{
        type: Number,
        default: [24]
      }]
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
      default: 'FREE'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED'],
      default: 'ACTIVE'
    },
    startDate: Date,
    endDate: Date
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  }
};

/**
 * Create tenant schema with tenant isolation
 * Note: Tenant model itself doesn't need tenant isolation as it's a top-level entity
 */
const tenantSchema = createSchema(tenantSchemaDefinition);

// Add custom methods
tenantSchema.methods.isActive = function() {
  return this.status === 'ACTIVE' && this.subscription.status === 'ACTIVE';
};

tenantSchema.methods.getBusinessHours = function(dayOfWeek: number) {
  return this.settings.businessHours.find((hours: any) => hours.dayOfWeek === dayOfWeek);
};

tenantSchema.methods.isHoliday = function(date: Date) {
  const checkDate = new Date(date);
  return this.settings.holidays.some((holiday: any) => {
    if (holiday.isRecurring) {
      return holiday.date.getMonth() === checkDate.getMonth() && 
             holiday.date.getDate() === checkDate.getDate();
    }
    return holiday.date.toDateString() === checkDate.toDateString();
  });
};

/**
 * Create and export the Tenant model
 */
export const Tenant = createModel<TenantDocument>('Tenant', tenantSchema);

export default Tenant; 