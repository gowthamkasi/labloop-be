import { Schema, model, Document, Types } from 'mongoose';
import { Hospital, HospitalContact, HospitalLicensing, HospitalOperations, HospitalSettings } from '../interfaces/Hospital.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface HospitalMongoDoc 
  extends Document,
    Omit<Hospital, '_id' | 'attachedLabs' | 'attachedCollectionCenters' | 'parentNetwork'> {
  attachedLabs?: Types.ObjectId[];
  attachedCollectionCenters?: Types.ObjectId[];
  parentNetwork?: Types.ObjectId;
  
  // Document methods
  generateHospitalId(): Promise<string>;
  getOperatingStatus(): { isOpen: boolean; nextChange?: string };
  updateRating(newRating: number): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const HospitalContactSchema = new Schema<HospitalContact>({
  phone: { type: String, required: true },
  email: {
    type: String,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  website: String,
  fax: String
}, { _id: false });

const HospitalLicensingSchema = new Schema<HospitalLicensing>({
  licenseNumber: { type: String, required: true },
  accreditation: String,
  validUntil: Date,
  issuingAuthority: String
}, { _id: false });

const OperatingHoursSchema = new Schema({
  open: String,
  close: String
}, { _id: false });

const HospitalOperationsSchema = new Schema<HospitalOperations>({
  operatingHours: {
    monday: OperatingHoursSchema,
    tuesday: OperatingHoursSchema,
    wednesday: OperatingHoursSchema,
    thursday: OperatingHoursSchema,
    friday: OperatingHoursSchema,
    saturday: OperatingHoursSchema,
    sunday: OperatingHoursSchema
  },
  emergencyServices: { type: Boolean, default: false },
  bedCapacity: { type: Number, min: 0 },
  departments: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 departments'
    }
  }],
  specializations: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 30;
      },
      message: 'Cannot have more than 30 specializations'
    }
  }]
}, { _id: false });

const HospitalSettingsSchema = new Schema<HospitalSettings>({
  allowOnlineBooking: { type: Boolean, default: true },
  allowWalkIns: { type: Boolean, default: true },
  maxDailyCapacity: { type: Number, default: 100 },
  averageWaitTime: { type: Number, default: 30 },
  autoConfirmAppointments: { type: Boolean, default: false }
}, { _id: false });

// Main Hospital Schema
const HospitalSchema = new Schema<HospitalMongoDoc>({
  hospitalId: { 
    type: String, 
    match: /^HOS\d{8}$/,
    required: true
  },
  name: { type: String, required: true, trim: true },
  hospitalType: { 
    type: String, 
    enum: ['government', 'private', 'semi-government', 'charitable'],
    required: true 
  },
  ownership: { 
    type: String, 
    enum: ['individual', 'partnership', 'corporation', 'trust', 'government'],
    required: true 
  },
  establishedDate: Date,
  
  contact: { type: HospitalContactSchema, required: true },
  address: {
    street: { type: String, required: true, maxlength: 200 },
    city: { type: String, required: true, maxlength: 100 },
    state: { type: String, required: true, maxlength: 100 },
    zipCode: { type: String, match: /^[0-9]{5,10}$/ },
    country: { type: String, default: 'India' },
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
  licensing: { type: HospitalLicensingSchema, required: true },
  operations: { type: HospitalOperationsSchema, required: true },
  settings: { type: HospitalSettingsSchema, default: {} },
  
  // Relationships
  attachedLabs: [{ type: Schema.Types.ObjectId, ref: 'Lab' }],
  attachedCollectionCenters: [{ type: Schema.Types.ObjectId, ref: 'CollectionCenter' }],
  parentNetwork: { type: Schema.Types.ObjectId, ref: 'HealthcareNetwork', sparse: true },
  
  // Mobile app fields
  reviewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  priceRange: { type: String, enum: ['$', '$$', '$$$'], default: '$$' },
  features: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 features'
    }
  }],
  services: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 services'
    }
  }],
  amenities: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 15;
      },
      message: 'Cannot have more than 15 amenities'
    }
  }],
  thumbnail: String,
  acceptsInsurance: { type: Boolean, default: true },
  description: { type: String, maxlength: 1000 },
  galleryCount: { type: Number, default: 0 },
  
  // Operational stats
  totalPatients: { type: Number, default: 0 },
  totalDoctors: { type: Number, default: 0 },
  occupancyRate: { type: Number, default: 0, min: 0, max: 100 },
  
  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  
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
  deletedAt: {
    type: Date,
    sparse: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  version: {
    type: Number,
    default: 1
  }
});

// Middleware
HospitalSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods
HospitalSchema.methods['generateHospitalId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('HOS', 'Hospital', 'hospitalId');
};

HospitalSchema.methods['getOperatingStatus'] = function(): { isOpen: boolean; nextChange?: string } {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const todayHours = this['operations'].operatingHours[currentDay as keyof typeof this.operations.operatingHours];
  
  if (!todayHours) {
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

HospitalSchema.methods['updateRating'] = function(newRating: number) {
  const currentTotal = this['averageRating'] * this['reviewCount'];
  this['reviewCount'] += 1;
  this['averageRating'] = (currentTotal + newRating) / this['reviewCount'];
  return this['save']();
};

HospitalSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

HospitalSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for hospitalId generation
HospitalSchema.pre('save', async function() {
  if (this.isNew && !this['hospitalId']) {
    this['hospitalId'] = await generateIdWithErrorHandling('HOS', 'Hospital', 'hospitalId');
  }
});

// Indexes
HospitalSchema.index({ hospitalId: 1 }, { unique: true });
HospitalSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });
HospitalSchema.index({ hospitalType: 1, isActive: 1 });
HospitalSchema.index({ 'licensing.licenseNumber': 1 }, { unique: true });
HospitalSchema.index({ 'address.coordinates': '2dsphere' });
HospitalSchema.index({ averageRating: -1, reviewCount: -1 });
HospitalSchema.index({ ownership: 1, isActive: 1 });

export const HospitalModel = model<HospitalMongoDoc>('Hospital', HospitalSchema);