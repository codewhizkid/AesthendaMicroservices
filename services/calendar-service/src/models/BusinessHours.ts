import mongoose, { Document, Schema } from 'mongoose';
import { BusinessHours as IBusinessHoursType } from '../types';

export interface IBusinessHours extends Document, Omit<IBusinessHoursType, 'id'> {
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const businessHoursSchema = new Schema<IBusinessHours>(
  {
    tenantId: { type: String, required: true, index: true },
    dayOfWeek: { 
      type: Number, 
      required: true,
      min: 0,
      max: 6
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isOpen: { type: Boolean, required: true },
    specialDate: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Compound index for efficient querying
businessHoursSchema.index({ tenantId: 1, dayOfWeek: 1 });
businessHoursSchema.index({ tenantId: 1, specialDate: 1 });

// Validate time format
businessHoursSchema.path('startTime').validate(function(value: string) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}, 'Invalid time format. Use HH:mm');

businessHoursSchema.path('endTime').validate(function(value: string) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
}, 'Invalid time format. Use HH:mm');

export const BusinessHours = mongoose.model<IBusinessHours>('BusinessHours', businessHoursSchema);
export default BusinessHours; 