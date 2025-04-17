import mongoose, { Document } from 'mongoose';
import { BusinessHours as IBusinessHoursType } from '../types';

export interface IBusinessHours extends Document, IBusinessHoursType {
  createdAt: Date;
  updatedAt: Date;
}

const businessHoursSchema = new mongoose.Schema<IBusinessHours>(
  {
    tenantId: { type: String, required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isOpen: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient querying by tenant and day
businessHoursSchema.index({ tenantId: 1, dayOfWeek: 1 }, { unique: true });

export const BusinessHours = mongoose.model<IBusinessHours>('BusinessHours', businessHoursSchema); 