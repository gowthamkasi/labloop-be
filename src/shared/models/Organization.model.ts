import { Schema, model, Document, Types } from 'mongoose';
import { 
  Organization, 
  OrganizationContact, 
  OrganizationOperatingHours, 
  OrganizationBranding, 
  OrganizationSettings,
  OrganizationStats,
  OrganizationSocialMedia
} from '../interfaces/Organization.interface.js';
import { Address } from '../interfaces/User.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface - handles differences between TS and Mongo types
export interface OrganizationMongoDoc 
  extends Document,
    Omit<Organization, '_id' | 'parentOrganizationId' | 'affiliatedOrganizations'> {
  parentOrganizationId?: Types.ObjectId;
  affiliatedOrganizations?: Types.ObjectId[];
  
  // Document methods
  generateOrganizationId(): Promise<string>;
  getFullAddress(): string;
  getTodaysOperatingHours(): string;
  isOperatingNow(): boolean;
  addAffiliation(orgId: Types.ObjectId): Promise<this>;
  removeAffiliation(orgId: Types.ObjectId): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const OrganizationContactSchema = new Schema<OrganizationContact>({
  phone: { 
    type: String, 
    required: true, 
    match: /^\+?[1-9]\d{1,14}$/
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  website: { 
    type: String, 
    match: /^https?:\/\/.*/,
    sparse: true 
  },
  emergencyContact: { 
    type: String, 
    match: /^\+?[1-9]\d{1,14}$/,
    sparse: true 
  }
}, { _id: false });

const AddressSchema = new Schema<Address>({
  street: { type: String, maxlength: 200 },
  city: { type: String, maxlength: 100 },
  state: { type: String, maxlength: 100 },
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
      index: '2dsphere'
    }
  }
}, { _id: false });

const OrganizationOperatingHoursSchema = new Schema<OrganizationOperatingHours>({
  monday: { type: String, default: '09:00-18:00' },
  tuesday: { type: String, default: '09:00-18:00' },
  wednesday: { type: String, default: '09:00-18:00' },
  thursday: { type: String, default: '09:00-18:00' },
  friday: { type: String, default: '09:00-18:00' },
  saturday: { type: String, default: '09:00-13:00' },
  sunday: { type: String, default: 'Closed' }
}, { _id: false });

const OrganizationBrandingSchema = new Schema<OrganizationBranding>({
  logo: { type: String, maxlength: 500 },
  tagline: { type: String, maxlength: 200 },
  primaryColor: { type: String, match: /^#[0-9A-Fa-f]{6}$/ },
  secondaryColor: { type: String, match: /^#[0-9A-Fa-f]{6}$/ }
}, { _id: false });

const OrganizationSettingsSchema = new Schema<OrganizationSettings>({
  allowOnlineBooking: { type: Boolean, default: true },
  allowHomeCollection: { type: Boolean, default: false },
  maxDailyCapacity: { type: Number, default: 100, min: 1 },
  averageReportTime: { type: Number, default: 24, min: 1 }, // in hours
  autoConfirmAppointments: { type: Boolean, default: false }
}, { _id: false });

const OrganizationStatsSchema = new Schema<OrganizationStats>({
  totalPatients: { type: Number, default: 0, min: 0 },
  totalTests: { type: Number, default: 0, min: 0 },
  reviewCount: { type: Number, default: 0, min: 0 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  completionRate: { type: Number, default: 0, min: 0, max: 100 }
}, { _id: false });

const OrganizationSocialMediaSchema = new Schema<OrganizationSocialMedia>({
  facebook: { type: String, match: /^https?:\/\/(www\.)?facebook\.com\/.*/ },
  twitter: { type: String, match: /^https?:\/\/(www\.)?twitter\.com\/.*/ },
  linkedin: { type: String, match: /^https?:\/\/(www\.)?linkedin\.com\/.*/ },
  instagram: { type: String, match: /^https?:\/\/(www\.)?instagram\.com\/.*/ }
}, { _id: false });

// Main Organization Schema
const OrganizationSchema = new Schema<OrganizationMongoDoc>({
  organizationId: { 
    type: String, 
    unique: true, 
    match: /^ORG\d{6}$/,
    required: true
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  type: { 
    type: String, 
    enum: ['hospital', 'lab', 'clinic', 'collection_center', 'diagnostic_center', 'pharmacy', 'other'],
    required: true
  },
  licenseNumber: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    uppercase: true
  },
  taxId: { 
    type: String, 
    sparse: true,
    trim: true,
    uppercase: true
  },
  contact: { type: OrganizationContactSchema, required: true },
  address: { type: AddressSchema, required: true },
  operatingHours: { type: OrganizationOperatingHoursSchema, required: true },
  branding: OrganizationBrandingSchema,
  settings: { type: OrganizationSettingsSchema, required: true },
  statistics: { type: OrganizationStatsSchema, required: true },
  socialMedia: OrganizationSocialMediaSchema,
  services: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 services'
    }
  }],
  specializations: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 30;
      },
      message: 'Cannot have more than 30 specializations'
    }
  }],
  amenities: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 20;
      },
      message: 'Cannot have more than 20 amenities'
    }
  }],
  
  // Network relationships
  parentOrganizationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Organization', 
    sparse: true 
  },
  affiliatedOrganizations: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Organization',
    validate: {
      validator: function(v: Types.ObjectId[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 affiliations'
    }
  }],
  
  // Verification and status
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date, sparse: true },
  establishedDate: { type: Date },
  
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
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  version: {
    type: Number,
    default: 1
  }
});

// Middleware
OrganizationSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods using bracket notation for TypeScript strict mode
OrganizationSchema.methods['generateOrganizationId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('ORG', 'Organization', 'organizationId');
};

OrganizationSchema.methods['getFullAddress'] = function(): string {
  const addr = this['address'];
  return [addr.street, addr.city, addr.state, addr.zipCode, addr.country]
    .filter(Boolean)
    .join(', ');
};

OrganizationSchema.methods['getTodaysOperatingHours'] = function(): string {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[new Date().getDay()] as keyof OrganizationOperatingHours;
  return this['operatingHours'][today] || 'Closed';
};

OrganizationSchema.methods['isOperatingNow'] = function(): boolean {
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const todayHours = this['getTodaysOperatingHours']();
  
  if (todayHours === 'Closed') return false;
  
  const [open, close] = todayHours.split('-');
  return currentTime >= open && currentTime <= close;
};

OrganizationSchema.methods['addAffiliation'] = function(orgId: Types.ObjectId) {
  if (!this['affiliatedOrganizations'].includes(orgId)) {
    this['affiliatedOrganizations'].push(orgId);
  }
  return this['save']();
};

OrganizationSchema.methods['removeAffiliation'] = function(orgId: Types.ObjectId) {
  this['affiliatedOrganizations'] = this['affiliatedOrganizations'].filter(
    (id: Types.ObjectId) => !id.equals(orgId)
  );
  return this['save']();
};

OrganizationSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

OrganizationSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for organizationId generation
OrganizationSchema.pre('save', async function() {
  if (this.isNew && !this['organizationId']) {
    this['organizationId'] = await generateIdWithErrorHandling('ORG', 'Organization', 'organizationId');
  }
});

// Indexes
OrganizationSchema.index({ organizationId: 1 }, { unique: true });
OrganizationSchema.index({ licenseNumber: 1 }, { unique: true });
OrganizationSchema.index({ 'contact.email': 1 }, { unique: true });
OrganizationSchema.index({ name: 1 });
OrganizationSchema.index({ type: 1, isActive: 1 });
OrganizationSchema.index({ 'address.coordinates': '2dsphere' });
OrganizationSchema.index({ 'address.city': 1, 'address.state': 1 });
OrganizationSchema.index({ services: 1 });
OrganizationSchema.index({ specializations: 1 });
OrganizationSchema.index({ isVerified: 1, isActive: 1 });
OrganizationSchema.index({ parentOrganizationId: 1 }, { sparse: true });

export const OrganizationModel = model<OrganizationMongoDoc>('Organization', OrganizationSchema);