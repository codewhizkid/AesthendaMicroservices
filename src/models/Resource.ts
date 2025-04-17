import mongoose, { Document } from 'mongoose';

export interface IResource extends Document {
  title: string;
  type: string;
  description?: string;
  tenantId: string;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
}, { _id: false });

const resourceSchema = new mongoose.Schema<IResource>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    description: String,
    tenantId: { type: String, required: true, index: true },
    availability: [availabilitySchema],
    metadata: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

resourceSchema.index({ tenantId: 1, type: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema); 