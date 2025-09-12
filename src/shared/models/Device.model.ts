import { Schema, model, Document, Types } from 'mongoose';
import { Device, DeviceInfo, DeviceLocation } from '../interfaces/Device.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface DeviceMongoDoc extends Document, Omit<Device, '_id' | 'userId'> {
  userId: Types.ObjectId;
  
  // Document methods
  generateDeviceId(): Promise<string>;
  updateLastActive(): Promise<this>;
  isExpired(): boolean;
  markAsTrusted(): Promise<this>;
  revoke(): Promise<void>;
}

// Embedded Schemas
const DeviceInfoSchema = new Schema<DeviceInfo>({
  type: { 
    type: String, 
    enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    default: 'unknown',
    required: true
  },
  browser: { type: String, maxlength: 100 },
  os: { type: String, maxlength: 100 },
  version: { type: String, maxlength: 50 },
  userAgent: { type: String, maxlength: 500 }
}, { _id: false });

const DeviceLocationSchema = new Schema<DeviceLocation>({
  ip: { 
    type: String, 
    match: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  },
  country: { type: String, maxlength: 100 },
  city: { type: String, maxlength: 100 },
  timezone: { type: String, maxlength: 50 }
}, { _id: false });

// Main Device Schema
const DeviceSchema = new Schema<DeviceMongoDoc>({
  deviceId: {
    type: String,
    match: /^DEV\d{8}$/,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceInfo: {
    type: DeviceInfoSchema,
    required: true
  },
  location: DeviceLocationSchema,
  refreshToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isTrusted: {
    type: Boolean,
    default: false
  },
  deviceName: {
    type: String,
    maxlength: 100,
    trim: true
  },
  
  // Timestamps
  firstLogin: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastActive: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  }
});

// Middleware
DeviceSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Auto-cleanup expired devices
DeviceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
DeviceSchema.methods['generateDeviceId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('DEV', 'Device', 'deviceId');
};

DeviceSchema.methods['updateLastActive'] = function() {
  this['lastActive'] = new Date();
  return this['save']();
};

DeviceSchema.methods['isExpired'] = function(): boolean {
  return new Date() > this['expiresAt'];
};

DeviceSchema.methods['markAsTrusted'] = function() {
  this['isTrusted'] = true;
  return this['save']();
};

DeviceSchema.methods['revoke'] = async function(): Promise<void> {
  await this['deleteOne']();
};

// Pre-save middleware for deviceId generation
DeviceSchema.pre('save', async function() {
  if (this.isNew && !this['deviceId']) {
    this['deviceId'] = await generateIdWithErrorHandling('DEV', 'Device', 'deviceId');
  }
});

// Indexes
DeviceSchema.index({ userId: 1, isActive: 1 });
DeviceSchema.index({ refreshToken: 1 }, { unique: true });
DeviceSchema.index({ userId: 1, 'deviceInfo.type': 1 });
DeviceSchema.index({ userId: 1, lastActive: -1 });

// Compound index for cleanup queries
DeviceSchema.index({ isActive: 1, expiresAt: 1 });

export const DeviceModel = model<DeviceMongoDoc>('Device', DeviceSchema);