import { Schema, model, Document, Types } from 'mongoose';
import { Lab, LabContact, LabLicensing, LabCapabilities, LabOperations, LabSettings } from '../interfaces/Lab.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface LabMongoDoc 
  extends Document,
    Omit<Lab, '_id' | 'parentHospital' | 'attachedCollectionCenters' | 'parentNetwork'> {
  parentHospital?: Types.ObjectId;
  attachedCollectionCenters?: Types.ObjectId[];
  parentNetwork?: Types.ObjectId;
  
  // Document methods
  generateLabId(): Promise<string>;
  getOperatingStatus(): { isOpen: boolean; nextChange?: string };
  updateRating(newRating: number): Promise<this>;
  calculateCompletionRate(): number;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const LabContactSchema = new Schema<LabContact>({
  phone: { type: String, required: true },
  email: {
    type: String,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  website: String,
  fax: String
}, { _id: false });

const LabLicensingSchema = new Schema<LabLicensing>({
  licenseNumber: { type: String, required: true },
  nabl: String,
  iso: String,
  cap: String,
  validUntil: Date
}, { _id: false });

const LabCapabilitiesSchema = new Schema<LabCapabilities>({
  testingCapabilities: [{ 
    type: String, 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0 && v.length <= 50;
      },
      message: 'Must have between 1 and 50 testing capabilities'
    }
  }],
  equipmentList: [{ 
    type: String,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 equipment items'
    }
  }],
  certifiedTechnicians: { type: Number, required: true, min: 1 },
  qualityControlMeasures: [String],
  turnaroundTime: { type: Number, required: true, min: 1 },
  sampleTypes: [{ type: String, required: true }]
}, { _id: false });

const OperatingHoursSchema = new Schema({
  open: String,
  close: String
}, { _id: false });

const LabOperationsSchema = new Schema<LabOperations>({
  operatingHours: {
    monday: OperatingHoursSchema,
    tuesday: OperatingHoursSchema,
    wednesday: OperatingHoursSchema,
    thursday: OperatingHoursSchema,
    friday: OperatingHoursSchema,
    saturday: OperatingHoursSchema,
    sunday: OperatingHoursSchema
  },
  homeCollection: { type: Boolean, default: false },
  emergencyServices: { type: Boolean, default: false },
  reportDeliveryMethods: [String],
  sampleStorageCapacity: { type: Number, min: 0 }
}, { _id: false });

const LabSettingsSchema = new Schema<LabSettings>({
  allowOnlineBooking: { type: Boolean, default: true },
  allowHomeCollection: { type: Boolean, default: false },
  maxDailyCapacity: { type: Number, default: 100 },
  averageReportTime: { type: Number, default: 24 },
  autoConfirmAppointments: { type: Boolean, default: false },
  digitalReports: { type: Boolean, default: true }
}, { _id: false });

// Main Lab Schema
const LabSchema = new Schema<LabMongoDoc>({
  labId: { 
    type: String, 
    match: /^LAB\d{8}$/,
    required: true
  },
  name: { type: String, required: true, trim: true },
  labType: { 
    type: String, 
    enum: ['pathology', 'radiology', 'clinical', 'molecular', 'microbiology', 'hematology', 'biochemistry'],
    required: true 
  },
  ownership: { 
    type: String, 
    enum: ['individual', 'partnership', 'corporation', 'hospital-owned', 'chain'],
    required: true 
  },
  establishedDate: Date,
  
  contact: { type: LabContactSchema, required: true },
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
  licensing: { type: LabLicensingSchema, required: true },
  capabilities: { type: LabCapabilitiesSchema, required: true },
  operations: { type: LabOperationsSchema, required: true },
  settings: { type: LabSettingsSchema, default: {} },
  
  // Relationships
  parentHospital: { type: Schema.Types.ObjectId, ref: 'Hospital' },
  attachedCollectionCenters: [{ type: Schema.Types.ObjectId, ref: 'CollectionCenter' }],
  parentNetwork: { type: Schema.Types.ObjectId, ref: 'HealthcareNetwork', sparse: true },
  
  // Mobile app fields
  reviewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  priceRange: { type: String, enum: ['$', '$$', '$$$'], default: '$' },
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
        return !v || v.length <= 20;
      },
      message: 'Cannot have more than 20 services'
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
  labDescription: { type: String, maxlength: 500 },
  galleryCount: { type: Number, default: 0 },
  
  // Operational stats
  totalTests: { type: Number, default: 0 },
  totalPatients: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 },
  sameDayResults: { type: Boolean, default: false },
  onlineReports: { type: Boolean, default: true },
  
  // Branding
  logo: String,
  tagline: String,
  primaryColor: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
  secondaryColor: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
  
  // Social media
  facebook: String,
  twitter: String,
  linkedin: String,
  
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
LabSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods
LabSchema.methods['generateLabId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('LAB', 'Lab', 'labId');
};

LabSchema.methods['getOperatingStatus'] = function(): { isOpen: boolean; nextChange?: string } {
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

LabSchema.methods['updateRating'] = function(newRating: number) {
  const currentTotal = this['averageRating'] * this['reviewCount'];
  this['reviewCount'] += 1;
  this['averageRating'] = (currentTotal + newRating) / this['reviewCount'];
  return this['save']();
};

LabSchema.methods['calculateCompletionRate'] = function(): number {
  // This would typically be calculated based on actual completed vs total tests
  // For now, return current value
  return this['completionRate'];
};

LabSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

LabSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for labId generation
LabSchema.pre('save', async function() {
  if (this.isNew && !this['labId']) {
    this['labId'] = await generateIdWithErrorHandling('LAB', 'Lab', 'labId');
  }
});

// Indexes
LabSchema.index({ labId: 1 }, { unique: true });
LabSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });
LabSchema.index({ labType: 1, isActive: 1 });
LabSchema.index({ 'licensing.licenseNumber': 1 }, { unique: true });
LabSchema.index({ 'address.coordinates': '2dsphere' });
LabSchema.index({ averageRating: -1, reviewCount: -1 });
LabSchema.index({ ownership: 1, isActive: 1 });
LabSchema.index({ parentHospital: 1 }, { sparse: true });
LabSchema.index({ 'capabilities.testingCapabilities': 1 });

export const LabModel = model<LabMongoDoc>('Lab', LabSchema);