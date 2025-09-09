import { Schema, model, Document, Types } from 'mongoose';
import { CollectionCenter, CollectionCenterContact, CollectionCenterOperatingHours, CollectionCenterCapabilities, CollectionCenterStaff, CollectionCenterStatus } from '../interfaces/CollectionCenter.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface CollectionCenterMongoDoc 
  extends Document,
    Omit<CollectionCenter, '_id' | 'parentLab'> {
  parentLab: Types.ObjectId;
  
  // Document methods
  generateCenterId(): Promise<string>;
  getOperatingStatus(): { isOpen: boolean; nextChange?: string };
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const CollectionCenterContactSchema = new Schema<CollectionCenterContact>({
  phone: { type: String, required: true, match: /^\+?[1-9]\d{1,14}$/ },
  email: {
    type: String,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  whatsapp: { type: String, match: /^\+?[1-9]\d{1,14}$/ }
}, { _id: false });

const OperatingHoursSchema = new Schema({
  open: String,
  close: String
}, { _id: false });

const CollectionCenterOperatingHoursSchema = new Schema<CollectionCenterOperatingHours>({
  monday: OperatingHoursSchema,
  tuesday: OperatingHoursSchema,
  wednesday: OperatingHoursSchema,
  thursday: OperatingHoursSchema,
  friday: OperatingHoursSchema,
  saturday: OperatingHoursSchema,
  sunday: OperatingHoursSchema
}, { _id: false });

const CollectionCenterCapabilitiesSchema = new Schema<CollectionCenterCapabilities>({
  sampleTypes: {
    type: [String],
    default: ['blood', 'urine', 'stool'],
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one sample type is required'
    }
  },
  dailyCapacity: { type: Number, default: 50, min: 1 },
  homeCollection: { type: Boolean, default: true },
  wheelchairAccessible: { type: Boolean, default: false },
  pediatricCollection: { type: Boolean, default: false }
}, { _id: false });

const CollectionCenterStaffSchema = new Schema<CollectionCenterStaff>({
  phlebotomists: { type: Number, default: 1, min: 1 },
  receptionist: { type: Boolean, default: true }
}, { _id: false });

const CollectionCenterStatusSchema = new Schema<CollectionCenterStatus>({
  isActive: { type: Boolean, default: true },
  temporarilyClosed: { type: Boolean, default: false },
  closureReason: { type: String, maxlength: 200 }
}, { _id: false });

// Main CollectionCenter Schema
const CollectionCenterSchema = new Schema<CollectionCenterMongoDoc>({
  centerId: { 
    type: String, 
    match: /^COL\d{8}$/,
    required: true
  },
  centerType: {
    type: String,
    enum: ['standalone', 'labAttached', 'mobile', 'kiosk'],
    required: true
  },
  parentLab: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lab', 
    required: true 
  },
  name: { type: String, required: true, trim: true },
  registrationNumber: { type: String, required: true, trim: true },
  contact: { type: CollectionCenterContactSchema, required: true },
  address: {
    street: { type: String, required: true, maxlength: 200 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    zipCode: { type: String, match: /^[0-9]{5,10}$/ },
    country: { type: String, default: 'India' },
    landmark: { type: String, maxlength: 100 },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
      }
    }
  },
  operatingHours: { type: CollectionCenterOperatingHoursSchema, required: true },
  capabilities: { type: CollectionCenterCapabilitiesSchema, required: true },
  staff: { type: CollectionCenterStaffSchema, required: true },
  status: { type: CollectionCenterStatusSchema, required: true },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware
CollectionCenterSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
CollectionCenterSchema.methods['generateCenterId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('COL', 'CollectionCenter', 'centerId');
};

CollectionCenterSchema.methods['getOperatingStatus'] = function(): { isOpen: boolean; nextChange?: string } {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = this['operatingHours'][currentDay as keyof typeof this.operatingHours];
  
  if (!todayHours || this['status'].temporarilyClosed) {
    return { isOpen: false };
  }
  
  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  const isOpen = currentTime >= openTime && currentTime <= closeTime;
  
  return {
    isOpen,
    nextChange: isOpen ? todayHours.close : todayHours.open
  };
};

CollectionCenterSchema.methods['softDelete'] = function() {
  this['status'].isActive = false;
  this['status'].temporarilyClosed = true;
  this['status'].closureReason = 'Permanently closed';
  return this['save']();
};

CollectionCenterSchema.methods['restore'] = function() {
  this['status'].isActive = true;
  this['status'].temporarilyClosed = false;
  this['status'].closureReason = undefined;
  return this['save']();
};

// Pre-save middleware for centerId generation
CollectionCenterSchema.pre('save', async function() {
  if (this.isNew && !this['centerId']) {
    this['centerId'] = await generateIdWithErrorHandling('COL', 'CollectionCenter', 'centerId');
  }
});

// Indexes
CollectionCenterSchema.index({ centerId: 1 }, { unique: true });
CollectionCenterSchema.index({ registrationNumber: 1 }, { unique: true });
CollectionCenterSchema.index({ parentLab: 1, 'status.isActive': 1 });
CollectionCenterSchema.index({ centerType: 1 });
CollectionCenterSchema.index({ 'address.city': 1, 'address.state': 1 });
CollectionCenterSchema.index({ 'address.coordinates': '2dsphere' });
CollectionCenterSchema.index({ name: 'text', 'address.city': 'text' });

export const CollectionCenterModel = model<CollectionCenterMongoDoc>('CollectionCenter', CollectionCenterSchema);