/**
 * Lab Model for LabLoop Healthcare System
 * Laboratory facilities with comprehensive testing capabilities and operational tracking
 * HIPAA-compliant with audit logging and accreditation management
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  ILab,
  IHospitalContact,
  IOperatingHours,
  ILabCapabilities,
  IHospitalSettings,
  IBranding,
  IMobileFields,
  ILabOperationalStats,
  ISocialMedia,
  ILabStatus,
  IAddress,
  LabType,
  LabOwnership,
  PriceRange
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const labCapabilitiesSchema = new Schema<ILabCapabilities>({
  testCategories: {
    type: [String],
    validate: {
      validator: (categories: string[]) => categories.length <= 50,
      message: 'Cannot have more than 50 test categories',
    },
  },
  specializations: {
    type: [String],
    validate: {
      validator: (specs: string[]) => specs.length <= 30,
      message: 'Cannot have more than 30 specializations',
    },
  },
  equipment: {
    type: [String],
    validate: {
      validator: (equipment: string[]) => equipment.length <= 50,
      message: 'Cannot have more than 50 equipment items',
    },
  },
  dailyCapacity: {
    type: Number,
    default: 100,
    min: [1, 'Daily capacity must be at least 1'],
  },
  homeCollection: {
    type: Boolean,
    default: false,
  },
  emergencyServices: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const labOperationalStatsSchema = new Schema<ILabOperationalStats>({
  sameDay: {
    type: Boolean,
    default: false,
  },
  homeCollection: {
    type: Boolean,
    default: false,
  },
  onlineReports: {
    type: Boolean,
    default: true,
  },
  totalTests: {
    type: Number,
    default: 0,
    min: [0, 'Total tests cannot be negative'],
  },
  totalPatients: {
    type: Number,
    default: 0,
    min: [0, 'Total patients cannot be negative'],
  },
  completionRate: {
    type: Number,
    default: 0,
    min: [0, 'Completion rate cannot be negative'],
    max: [100, 'Completion rate cannot exceed 100%'],
  },
}, { _id: false });

const socialMediaSchema = new Schema<ISocialMedia>({
  facebook: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/(www\.)?facebook\.com\/.*/.test(url),
      message: 'Facebook URL must be valid',
    },
  },
  twitter: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/.test(url),
      message: 'Twitter/X URL must be valid',
    },
  },
  linkedin: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/(www\.)?linkedin\.com\/.*/.test(url),
      message: 'LinkedIn URL must be valid',
    },
  },
}, { _id: false });

const labStatusSchema = new Schema<ILabStatus>({
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
    validate: {
      validator: function(this: ILabStatus, date: Date) {
        return !date || (this.isVerified && date <= new Date());
      },
      message: 'Verified date cannot be in the future and requires isVerified to be true',
    },
  },
}, { _id: false });

// Reuse existing schemas from Hospital model with appropriate modifications
const labContactSchema = new Schema<IHospitalContact>({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Please provide a valid phone number',
    },
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
      message: 'Please provide a valid email address',
    },
  },
  website: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/.*/.test(url),
      message: 'Website must be a valid URL',
    },
  },
  emergencyContact: {
    type: String,
    validate: {
      validator: (phone: string) => !phone || /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Emergency contact must be a valid phone number',
    },
  },
}, { _id: false });

const labAddressSchema = new Schema<IAddress & { coordinates?: { type: 'Point'; coordinates: [number, number] } }>({
  street: {
    type: String,
    required: [true, 'Street address is required'],
    maxlength: [200, 'Street address cannot exceed 200 characters'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    maxlength: [100, 'City name cannot exceed 100 characters'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    maxlength: [100, 'State name cannot exceed 100 characters'],
    trim: true,
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    validate: {
      validator: (zip: string) => /^[0-9]{5,10}$/.test(zip),
      message: 'ZIP code must be 5-10 digits',
    },
  },
  country: {
    type: String,
    default: 'India',
    trim: true,
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
      validate: {
        validator: (coords: number[]) => !coords || (coords.length === 2 && coords.every(c => typeof c === 'number')),
        message: 'Coordinates must be an array of two numbers [longitude, latitude]',
      },
    },
  },
}, { _id: false });

const operatingHoursSchema = new Schema<IOperatingHours>({
  monday: {
    type: String,
    default: '09:00-18:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  tuesday: {
    type: String,
    default: '09:00-18:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  wednesday: {
    type: String,
    default: '09:00-18:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  thursday: {
    type: String,
    default: '09:00-18:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  friday: {
    type: String,
    default: '09:00-18:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  saturday: {
    type: String,
    default: '09:00-13:00',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
  sunday: {
    type: String,
    default: 'Closed',
    validate: {
      validator: (time: string) => /^(\d{2}:\d{2}-\d{2}:\d{2}|Closed)$/.test(time),
      message: 'Operating hours must be in format HH:MM-HH:MM or "Closed"',
    },
  },
}, { _id: false });

const labSettingsSchema = new Schema<IHospitalSettings>({
  allowOnlineBooking: {
    type: Boolean,
    default: true,
  },
  allowHomeCollection: {
    type: Boolean,
    default: false,
  },
  maxDailyCapacity: {
    type: Number,
    default: 100,
    min: [1, 'Daily capacity must be at least 1'],
  },
  averageReportTime: {
    type: Number,
    default: 24,
    min: [1, 'Average report time must be at least 1 hour'],
  },
  autoConfirmAppointments: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const brandingSchema = new Schema<IBranding>({
  logo: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/i.test(url),
      message: 'Logo must be a valid image URL',
    },
  },
  tagline: {
    type: String,
    maxlength: [100, 'Tagline cannot exceed 100 characters'],
    trim: true,
  },
  primaryColor: {
    type: String,
    validate: {
      validator: (color: string) => !color || /^#[0-9A-Fa-f]{6}$/.test(color),
      message: 'Primary color must be a valid hex color code',
    },
  },
  secondaryColor: {
    type: String,
    validate: {
      validator: (color: string) => !color || /^#[0-9A-Fa-f]{6}$/.test(color),
      message: 'Secondary color must be a valid hex color code',
    },
  },
}, { _id: false });

const labMobileFieldsSchema = new Schema<IMobileFields & { labDescription?: string }>({
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative'],
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
  },
  priceRange: {
    type: String,
    enum: {
      values: ['$', '$$', '$$$'] as PriceRange[],
      message: 'Price range must be $, $$, or $$$',
    },
    default: '$',
  },
  features: {
    type: [String],
    default: [],
    validate: {
      validator: (features: string[]) => features.length <= 10,
      message: 'Cannot have more than 10 features',
    },
  },
  services: {
    type: [String],
    default: [],
    validate: {
      validator: (services: string[]) => services.length <= 20,
      message: 'Cannot have more than 20 services',
    },
  },
  amenities: {
    type: [String],
    default: [],
    validate: {
      validator: (amenities: string[]) => amenities.length <= 15,
      message: 'Cannot have more than 15 amenities',
    },
  },
  thumbnail: {
    type: String,
    validate: {
      validator: (url: string) => !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(url),
      message: 'Thumbnail must be a valid image URL',
    },
  },
  acceptsInsurance: {
    type: Boolean,
    default: true,
  },
  averageWaitTime: {
    type: Number,
    default: 15,
    min: [0, 'Wait time cannot be negative'],
  },
  hospitalDescription: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true,
  },
  galleryCount: {
    type: Number,
    default: 0,
    min: [0, 'Gallery count cannot be negative'],
  },
  labDescription: {
    type: String,
    maxlength: [500, 'Lab description cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

// ====================== MAIN LAB SCHEMA ======================

const labSchema = new Schema<ILab>({
  labId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (labId: string) => /^LAB[0-9]{6}$/.test(labId),
      message: 'Lab ID must follow pattern LAB followed by 6 digits',
    },
  },
  labType: {
    type: String,
    required: [true, 'Lab type is required'],
    enum: {
      values: ['diagnostic', 'pathology', 'radiology', 'combined', 'specialized'] as LabType[],
      message: 'Invalid lab type',
    },
  },
  ownership: {
    type: String,
    required: [true, 'Ownership type is required'],
    enum: {
      values: ['independent', 'hospitalAttached', 'chain', 'franchise'] as LabOwnership[],
      message: 'Invalid ownership type',
    },
  },
  parentHospital: {
    type: Schema.Types.ObjectId,
    ref: 'hospitals',
    sparse: true,
    validate: {
      validator: function(this: ILab, hospitalId: Types.ObjectId) {
        return !hospitalId || this.ownership === 'hospitalAttached';
      },
      message: 'Parent hospital can only be set for hospital-attached labs',
    },
  },
  attachedCollectionCenters: {
    type: [Schema.Types.ObjectId],
    ref: 'collectionCenters',
    validate: {
      validator: (centers: Types.ObjectId[]) => centers.length <= 50,
      message: 'Cannot have more than 50 attached collection centers',
    },
  },
  name: {
    type: String,
    required: [true, 'Lab name is required'],
    trim: true,
    minlength: [2, 'Lab name must be at least 2 characters'],
    maxlength: [100, 'Lab name cannot exceed 100 characters'],
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'License number cannot exceed 50 characters'],
  },
  nablAccreditationNumber: {
    type: String,
    sparse: true,
    trim: true,
    maxlength: [50, 'NABL accreditation number cannot exceed 50 characters'],
  },
  capAccreditationNumber: {
    type: String,
    sparse: true,
    trim: true,
    maxlength: [50, 'CAP accreditation number cannot exceed 50 characters'],
  },
  taxId: {
    type: String,
    sparse: true,
    trim: true,
    maxlength: [50, 'Tax ID cannot exceed 50 characters'],
  },
  contact: {
    type: labContactSchema,
    required: [true, 'Contact information is required'],
  },
  address: {
    type: labAddressSchema,
    required: [true, 'Address is required'],
  },
  operatingHours: {
    type: operatingHoursSchema,
    required: [true, 'Operating hours are required'],
  },
  capabilities: {
    type: labCapabilitiesSchema,
    required: [true, 'Capabilities information is required'],
  },
  settings: {
    type: labSettingsSchema,
    required: [true, 'Settings are required'],
  },
  branding: brandingSchema,
  mobileFields: {
    type: labMobileFieldsSchema,
    required: [true, 'Mobile fields are required'],
  },
  operationalStats: {
    type: labOperationalStatsSchema,
    required: [true, 'Operational statistics are required'],
  },
  socialMedia: socialMediaSchema,
  parentNetwork: {
    type: Schema.Types.ObjectId,
    ref: 'healthcareNetworks',
    sparse: true,
  },
  status: {
    type: labStatusSchema,
    required: [true, 'Status information is required'],
  },
  establishedDate: {
    type: Date,
    validate: {
      validator: (date: Date) => !date || date <= new Date(),
      message: 'Established date cannot be in the future',
    },
  },
  metadata: {
    createdAt: { 
      type: Date, 
      default: Date.now,
      immutable: true,
    },
    updatedAt: { 
      type: Date, 
      default: Date.now,
    },
    deletedAt: { 
      type: Date, 
      sparse: true,
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'users',
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'users',
    },
    _id: false,
  },
}, {
  timestamps: false, // Using custom metadata timestamps
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive information from JSON output
      delete ret.__v;
      return ret;
    },
  },
  toObject: { 
    virtuals: true,
  },
});

// ====================== INDEXES ======================

// Unique indexes
labSchema.index({ labId: 1 }, { unique: true });
labSchema.index({ licenseNumber: 1 }, { unique: true });

// Basic operational indexes
labSchema.index({ labType: 1, 'status.isActive': 1 });
labSchema.index({ ownership: 1, 'status.isActive': 1 });
labSchema.index({ 'status.isActive': 1, 'status.isVerified': 1 });

// Relationship indexes
labSchema.index({ parentHospital: 1 }, { sparse: true });
labSchema.index({ attachedCollectionCenters: 1 }, { sparse: true });
labSchema.index({ parentNetwork: 1 }, { sparse: true });

// Location-based indexes
labSchema.index({ 'address.city': 1, 'address.state': 1 });
labSchema.index({ 'address.coordinates': '2dsphere' });

// Mobile app optimization indexes
labSchema.index({ 
  'mobileFields.averageRating': -1, 
  'mobileFields.reviewCount': -1 
});
labSchema.index({ 'mobileFields.priceRange': 1 });

// Capabilities and services indexes
labSchema.index({ 'capabilities.testCategories': 1 });
labSchema.index({ 'capabilities.homeCollection': 1 });
labSchema.index({ 'capabilities.emergencyServices': 1 });

// Text search index
labSchema.index({
  name: 'text',
  'address.city': 'text',
  'address.state': 'text',
  'capabilities.testCategories': 'text',
  'capabilities.specializations': 'text',
  'mobileFields.labDescription': 'text'
});

// Compound indexes for common queries
labSchema.index({ 
  labType: 1, 
  'address.city': 1, 
  'status.isActive': 1 
});
labSchema.index({ 
  'capabilities.homeCollection': 1, 
  'address.city': 1,
  'status.isActive': 1 
});
labSchema.index({ 
  'settings.allowOnlineBooking': 1, 
  'status.isActive': 1 
});

// Accreditation indexes
labSchema.index({ nablAccreditationNumber: 1 }, { sparse: true });
labSchema.index({ capAccreditationNumber: 1 }, { sparse: true });

// Metadata indexes
labSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });
labSchema.index({ 'metadata.createdAt': -1 });

// ====================== VIRTUAL PROPERTIES ======================

labSchema.virtual('hasHomeCollection').get(function () {
  return this.capabilities.homeCollection && this.status.isActive;
});

labSchema.virtual('hasEmergencyServices').get(function () {
  return this.capabilities.emergencyServices && this.status.isActive;
});

labSchema.virtual('isAccredited').get(function () {
  return !!(this.nablAccreditationNumber || this.capAccreditationNumber);
});

labSchema.virtual('acceptsOnlineBooking').get(function () {
  return this.settings.allowOnlineBooking && this.status.isActive;
});

labSchema.virtual('isHospitalAttached').get(function () {
  return this.ownership === 'hospitalAttached' && !!this.parentHospital;
});

labSchema.virtual('hasCollectionCenters').get(function () {
  return this.attachedCollectionCenters && this.attachedCollectionCenters.length > 0;
});

labSchema.virtual('operatingAge').get(function () {
  if (!this.establishedDate) return null;
  const today = new Date();
  return today.getFullYear() - this.establishedDate.getFullYear();
});

labSchema.virtual('serviceLevel').get(function () {
  const rating = this.mobileFields.averageRating;
  if (rating >= 4.5) return 'Premium';
  if (rating >= 3.5) return 'Standard';
  if (rating >= 2.5) return 'Basic';
  return 'Developing';
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
labSchema.pre('save', async function (next) {
  // Auto-generate labId if not provided
  if (this.isNew && !this.labId) {
    this.labId = await generateLabId();
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Sync capabilities with operational stats
  if (this.isModified('capabilities')) {
    this.operationalStats.homeCollection = this.capabilities.homeCollection;
  }

  // Auto-update mobile fields based on capabilities
  if (this.isModified('capabilities')) {
    if (!this.mobileFields.services || this.mobileFields.services.length === 0) {
      this.mobileFields.services = this.capabilities.testCategories?.slice(0, 20) || [];
    }
  }

  // Validate parent hospital relationship
  if (this.ownership === 'hospitalAttached' && !this.parentHospital) {
    this.invalidate('parentHospital', 'Hospital-attached labs must have a parent hospital');
  }

  if (this.ownership !== 'hospitalAttached' && this.parentHospital) {
    this.parentHospital = undefined;
  }

  next();
});

// Pre-validate middleware
labSchema.pre('validate', function (next) {
  // Normalize contact information
  if (this.contact.email) {
    this.contact.email = this.contact.email.toLowerCase().trim();
  }

  // Ensure emergency service labs have emergency contact
  if (this.capabilities.emergencyServices && !this.contact.emergencyContact) {
    this.invalidate('contact.emergencyContact', 'Emergency service labs must have emergency contact');
  }

  next();
});

// Post-save middleware for logging
labSchema.post('save', function (doc, next) {
  console.log(`Lab ${doc.name} (${doc.labId}) has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
labSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

labSchema.methods.addCollectionCenter = function (centerId: Types.ObjectId) {
  if (!this.attachedCollectionCenters) {
    this.attachedCollectionCenters = [];
  }
  
  if (!this.attachedCollectionCenters.includes(centerId) && this.attachedCollectionCenters.length < 50) {
    this.attachedCollectionCenters.push(centerId);
    return this.save();
  }
  
  return Promise.resolve(this);
};

labSchema.methods.removeCollectionCenter = function (centerId: Types.ObjectId) {
  if (this.attachedCollectionCenters) {
    this.attachedCollectionCenters = this.attachedCollectionCenters.filter(id => !id.equals(centerId));
    return this.save();
  }
  return Promise.resolve(this);
};

labSchema.methods.updateCapacity = function (dailyCapacity: number) {
  this.capabilities.dailyCapacity = dailyCapacity;
  this.settings.maxDailyCapacity = dailyCapacity;
  return this.save();
};

labSchema.methods.updateRating = function (newRating: number) {
  const totalRating = this.mobileFields.averageRating * this.mobileFields.reviewCount;
  this.mobileFields.reviewCount += 1;
  this.mobileFields.averageRating = (totalRating + newRating) / this.mobileFields.reviewCount;
  return this.save();
};

labSchema.methods.addTestCategory = function (category: string) {
  if (!this.capabilities.testCategories) {
    this.capabilities.testCategories = [];
  }
  
  if (!this.capabilities.testCategories.includes(category) && this.capabilities.testCategories.length < 50) {
    this.capabilities.testCategories.push(category);
    return this.save();
  }
  
  return Promise.resolve(this);
};

labSchema.methods.updateStats = function (stats: Partial<ILabOperationalStats>) {
  this.operationalStats = {
    ...this.operationalStats,
    ...stats,
  };
  return this.save();
};

labSchema.methods.verify = function (verifiedBy?: Types.ObjectId) {
  this.status.isVerified = true;
  this.status.verifiedAt = new Date();
  if (verifiedBy) {
    this.metadata.updatedBy = verifiedBy;
  }
  return this.save();
};

labSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

labSchema.statics.findByLabId = function (labId: string) {
  return this.findOne({ labId });
};

labSchema.statics.findByLicenseNumber = function (licenseNumber: string) {
  return this.findOne({ licenseNumber });
};

labSchema.statics.findActiveLabs = function (filter: any = {}) {
  return this.find({ ...filter, 'status.isActive': true });
};

labSchema.statics.findByType = function (labType: LabType) {
  return this.find({ labType, 'status.isActive': true });
};

labSchema.statics.findByOwnership = function (ownership: LabOwnership) {
  return this.find({ ownership, 'status.isActive': true });
};

labSchema.statics.findByCity = function (city: string) {
  return this.find({ 'address.city': new RegExp(city, 'i'), 'status.isActive': true });
};

labSchema.statics.findWithHomeCollection = function (city?: string) {
  const query: any = { 
    'capabilities.homeCollection': true, 
    'status.isActive': true 
  };
  
  if (city) {
    query['address.city'] = new RegExp(city, 'i');
  }
  
  return this.find(query);
};

labSchema.statics.findNearby = function (
  longitude: number, 
  latitude: number, 
  maxDistanceKm: number = 10
) {
  return this.find({
    'address.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceKm * 1000, // Convert to meters
      },
    },
    'status.isActive': true,
  });
};

labSchema.statics.findByParentHospital = function (hospitalId: Types.ObjectId) {
  return this.find({ 
    parentHospital: hospitalId, 
    'status.isActive': true 
  });
};

labSchema.statics.findAccredited = function () {
  return this.find({
    $or: [
      { nablAccreditationNumber: { $exists: true, $ne: null } },
      { capAccreditationNumber: { $exists: true, $ne: null } }
    ],
    'status.isActive': true,
  });
};

// ====================== HELPER FUNCTIONS ======================

async function generateLabId(): Promise<string> {
  const Lab = model<ILab>('Lab');
  let labId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    labId = `LAB${timestamp}${random}`;
    exists = await Lab.exists({ labId });
  } while (exists);

  return labId;
}

// ====================== MODEL EXPORT ======================

export const Lab: Model<ILab> = model<ILab>('Lab', labSchema);
export default Lab;