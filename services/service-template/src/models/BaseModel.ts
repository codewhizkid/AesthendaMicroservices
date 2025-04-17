import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Base interface for all documents with tenant isolation
 */
export interface BaseDocument extends Document {
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base schema fields for all models
 */
export const baseSchemaFields = {
  tenantId: {
    type: String,
    required: [true, 'Tenant ID is required'],
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
};

/**
 * Creates a schema with the base fields needed for tenant isolation
 */
export function createSchema(
  definition: Record<string, any>,
  options: mongoose.SchemaOptions = {}
): Schema {
  // Combine the base fields with the provided definition
  const schemaDefinition = {
    ...baseSchemaFields,
    ...definition
  };

  // Create the schema with timestamps
  const schema = new Schema(
    schemaDefinition,
    {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
      ...options
    }
  );
  
  // Add tenant-specific methods
  schema.statics.findByIdWithTenant = async function(id, tenantId) {
    return this.findOne({ _id: id, tenantId });
  };
  
  schema.statics.findByTenant = async function(tenantId, options = {}) {
    return this.find({ tenantId, ...options });
  };
  
  schema.statics.findOneWithTenant = async function(filter, tenantId) {
    return this.findOne({ ...filter, tenantId });
  };
  
  schema.statics.updateByIdWithTenant = async function(id, update, tenantId) {
    // Prevent updates to tenantId field for security
    if (update.tenantId) {
      delete update.tenantId;
    }
    
    return this.findOneAndUpdate(
      { _id: id, tenantId },
      update,
      { new: true }
    );
  };
  
  schema.statics.deleteByIdWithTenant = async function(id, tenantId) {
    const result = await this.deleteOne({ _id: id, tenantId });
    return result.deletedCount === 1;
  };
  
  // Add query middleware to enforce tenant filtering
  // These use @ts-ignore to avoid complex type errors
  schema.pre('find', function() {
    // @ts-ignore
    if (this._tenantId && !this.getQuery().tenantId) {
      // @ts-ignore
      this.where({ tenantId: this._tenantId });
    }
  });
  
  schema.pre('findOne', function() {
    // @ts-ignore
    if (this._tenantId && !this.getQuery().tenantId) {
      // @ts-ignore
      this.where({ tenantId: this._tenantId });
    }
  });
  
  schema.pre('findOneAndUpdate', function() {
    // @ts-ignore
    if (this._tenantId && !this.getQuery().tenantId) {
      // @ts-ignore
      this.where({ tenantId: this._tenantId });
    }
  });
  
  schema.pre('deleteOne', function() {
    // @ts-ignore
    if (this._tenantId && !this.getQuery().tenantId) {
      // @ts-ignore
      this.where({ tenantId: this._tenantId });
    }
  });
  
  return schema;
}

/**
 * Helper function to create a model with tenant methods
 */
export function createModel<T extends BaseDocument>(
  modelName: string, 
  schema: Schema
): Model<T> {
  return mongoose.model<T>(modelName, schema);
} 