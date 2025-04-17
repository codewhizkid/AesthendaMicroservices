import mongoose, { Document, Schema } from "mongoose";

/**
 * Appointment status enum
 */
export enum AppointmentStatus {
  PENDING_CONFIRMATION = "pending_confirmation",
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  NONE = "none",
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

/**
 * Appointment document interface
 */
export interface IAppointment extends Document {
  tenantId: string;
  userId: string;
  stylistId: string;
  serviceIds: string[];
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  status: AppointmentStatus;
  price: number;
  notes?: string;
  cancellationReason?: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentError?: string;
  refundId?: string;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Appointment schema
 */
const AppointmentSchema = new Schema<IAppointment>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    stylistId: {
      type: String,
      required: true,
      index: true,
    },
    serviceIds: [
      {
        type: String,
        required: true,
      },
    ],
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    duration: {
      type: Number,
      required: true,
      min: 5, // Minimum 5 minutes
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.NONE,
      index: true,
    },
    paymentId: {
      type: String,
      sparse: true,
    },
    paymentError: {
      type: String,
    },
    refundId: {
      type: String,
      sparse: true,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Create compound indexes
AppointmentSchema.index({ tenantId: 1, date: 1, stylistId: 1 });
AppointmentSchema.index({ tenantId: 1, userId: 1, date: 1 });
AppointmentSchema.index({ tenantId: 1, status: 1, date: 1 });
AppointmentSchema.index({ tenantId: 1, paymentStatus: 1 });

// Enforce tenant isolation in all queries
AppointmentSchema.pre(/^find/, function (this: any, next) {
  if (!this._conditions.tenantId && !this._tenantBypass) {
    throw new Error("Tenant ID is required for all appointment queries");
  }
  next();
});

// Enforce tenant isolation in all updates
AppointmentSchema.pre(["updateOne", "updateMany"], function (this: any, next) {
  if (!this._conditions.tenantId && !this._tenantBypass) {
    throw new Error("Tenant ID is required for all appointment updates");
  }
  next();
});

// Enforce tenant isolation in all deletes
AppointmentSchema.pre(["deleteOne", "deleteMany"], function (this: any, next) {
  if (!this._conditions.tenantId && !this._tenantBypass) {
    throw new Error("Tenant ID is required for all appointment deletes");
  }
  next();
});

// Add method to bypass tenant check (for admin operations)
AppointmentSchema.static("bypassTenant", function (this: any) {
  const query = this.find();
  query._tenantBypass = true;
  return query;
});

// Create and export the model
export const Appointment = mongoose.model<IAppointment>(
  "Appointment",
  AppointmentSchema,
);

export default Appointment;
