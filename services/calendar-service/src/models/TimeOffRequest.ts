import mongoose, { Document, Schema } from 'mongoose';

/**
 * TimeOffRequest status enum
 */
export enum TimeOffRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  CANCELLED = 'cancelled'
}

/**
 * TimeOffRequest type enum
 */
export enum TimeOffRequestType {
  VACATION = 'vacation',
  SICK = 'sick',
  PERSONAL = 'personal',
  OTHER = 'other'
}

/**
 * TimeOffRequest interface
 */
export interface ITimeOffRequest extends Document {
  tenantId: string;
  staffId: string;
  type: TimeOffRequestType;
  status: TimeOffRequestStatus;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  startTime?: string; // Format: HH:MM, only used if allDay is false
  endTime?: string;   // Format: HH:MM, only used if allDay is false
  reason: string;
  notes: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // User ID of the reviewer
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TimeOffRequest schema
 */
const timeOffRequestSchema = new Schema<ITimeOffRequest>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true
    },
    staffId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(TimeOffRequestType),
      default: TimeOffRequestType.VACATION
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(TimeOffRequestStatus),
      default: TimeOffRequestStatus.PENDING
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(this: ITimeOffRequest, endDate: Date) {
          return endDate >= this.startDate;
        },
        message: 'End date must be on or after start date'
      }
    },
    allDay: {
      type: Boolean,
      default: true
    },
    startTime: {
      type: String,
      validate: {
        validator: (v: string | undefined) => {
          if (!v) return true;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      validate: {
        validator: (v: string | undefined) => {
          if (!v) return true;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    },
    reason: {
      type: String,
      required: true
    },
    notes: {
      type: String,
      default: ''
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    reviewedBy: String,
    reviewNotes: String
  },
  {
    timestamps: true
  }
);

// Create compound indexes for efficient querying
timeOffRequestSchema.index({ tenantId: 1, staffId: 1, status: 1 });
timeOffRequestSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });

// Validators
timeOffRequestSchema.pre('validate', function(next) {
  // If not allDay, ensure startTime and endTime are present
  if (!this.allDay) {
    if (!this.startTime) {
      this.invalidate('startTime', 'Start time is required for non-all-day requests');
    }
    if (!this.endTime) {
      this.invalidate('endTime', 'End time is required for non-all-day requests');
    }
  }
  next();
});

// Pre-save hook
timeOffRequestSchema.pre('save', function(next) {
  // If status is changing to approved/denied, add reviewedAt timestamp
  if (this.isModified('status') && 
      (this.status === TimeOffRequestStatus.APPROVED || 
       this.status === TimeOffRequestStatus.DENIED)) {
    this.reviewedAt = new Date();
  }
  next();
});

// Instance methods
timeOffRequestSchema.methods.overlaps = function(startDate: Date, endDate: Date): boolean {
  return (
    (this.startDate <= endDate && this.endDate >= startDate) || 
    (startDate <= this.endDate && endDate >= this.startDate)
  );
};

timeOffRequestSchema.methods.approve = function(reviewerId: string, notes: string = '') {
  this.status = TimeOffRequestStatus.APPROVED;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

timeOffRequestSchema.methods.deny = function(reviewerId: string, notes: string = '') {
  this.status = TimeOffRequestStatus.DENIED;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  return this.save();
};

timeOffRequestSchema.methods.cancel = function() {
  this.status = TimeOffRequestStatus.CANCELLED;
  return this.save();
};

// Static methods
timeOffRequestSchema.statics.findByDateRange = function(
  tenantId: string, 
  startDate: Date, 
  endDate: Date
) {
  return this.find({
    tenantId,
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } }
    ]
  });
};

timeOffRequestSchema.statics.findPendingRequests = function(tenantId: string) {
  return this.find({
    tenantId,
    status: TimeOffRequestStatus.PENDING
  }).sort({ startDate: 1 });
};

timeOffRequestSchema.statics.findStaffRequests = function(
  tenantId: string,
  staffId: string
) {
  return this.find({
    tenantId,
    staffId
  }).sort({ startDate: -1 });
};

export const TimeOffRequest = mongoose.model<ITimeOffRequest>(
  'TimeOffRequest',
  timeOffRequestSchema
);

export default TimeOffRequest; 