/**
 * Hospital Model for LabLoop Healthcare System
 * Healthcare facilities with comprehensive lab management and operational tracking
 * HIPAA-compliant with audit logging and comprehensive validation
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  IHospital,
  IHospitalContact,
  IOperatingHours,
  IHospitalCapabilities,
  IHospitalSettings,
  IBranding,
  IMobileFields,
  IHospitalStatus,
  IAccreditation,
  IAddress,
  HospitalType,
  PriceRange
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const accreditationSchema = new Schema<IAccreditation>({
  nabh: {
    type: Boolean,
    default: false,
  },
  nabl: {
    type: Boolean,
    default: false,
  },
  jci: {
    type: Boolean,
    default: false,
  },
  iso: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const hospitalContactSchema = new Schema<IHospitalContact>({
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

const hospitalAddressSchema = new Schema<IAddress & { coordinates?: { type: 'Point'; coordinates: [number, number] } }>({
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

const hospitalCapabilitiesSchema = new Schema<IHospitalCapabilities>({
  services: {
    type: [String],
    validate: {
      validator: (services: string[]) => services.length <= 50,
      message: 'Cannot have more than 50 services',
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
  certificationsCount: {
    type: Number,
    default: 0,
    min: [0, 'Certifications count cannot be negative'],
  },
  activeCertifications: {
    type: [Schema.Types.Mixed],
    validate: {
      validator: (certs: any[]) => certs.length <= 5,
      message: 'Cannot have more than 5 active certifications',
    },
  },
}, { _id: false });

const hospitalSettingsSchema = new Schema<IHospitalSettings>({
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

const mobileFieldsSchema = new Schema<IMobileFields>({
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
}, { _id: false });

const hospitalStatusSchema = new Schema<IHospitalStatus>({
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
      validator: function(this: IHospitalStatus, date: Date) {
        return !date || (this.isVerified && date <= new Date());
      },
      message: 'Verified date cannot be in the future and requires isVerified to be true',
    },
  },
}, { _id: false });

// ====================== MAIN HOSPITAL SCHEMA ======================

const hospitalSchema = new Schema<IHospital>({
  hospitalId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (hospitalId: string) => /^HSP[0-9]{6}$/.test(hospitalId),
      message: 'Hospital ID must follow pattern HSP followed by 6 digits',
    },
  },
  hospitalType: {
    type: String,
    required: [true, 'Hospital type is required'],
    enum: {
      values: ['general', 'specialty', 'multiSpecialty', 'teaching', 'research'] as HospitalType[],
      message: 'Invalid hospital type',
    },
  },
  accreditation: {
    type: accreditationSchema,
    required: [true, 'Accreditation information is required'],
  },
  departments: {
    type: [String],
    validate: {
      validator: (departments: string[]) => departments.length <= 50,
      message: 'Cannot have more than 50 departments',
    },
  },
  bedCapacity: {
    type: Number,
    min: [0, 'Bed capacity cannot be negative'],
  },
  icuBeds: {
    type: Number,
    min: [0, 'ICU bed count cannot be negative'],
    validate: {
      validator: function(this: IHospital, icuBeds: number) {
        return !icuBeds || !this.bedCapacity || icuBeds <= this.bedCapacity;
      },
      message: 'ICU beds cannot exceed total bed capacity',
    },
  },
  emergencyServices: {
    type: Boolean,
    default: false,
  },
  attachedLabs: {
    type: [Schema.Types.ObjectId],
    ref: 'labs',
    validate: {
      validator: (labs: Types.ObjectId[]) => labs.length <= 10,
      message: 'Cannot have more than 10 attached labs',
    },
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    minlength: [2, 'Hospital name must be at least 2 characters'],
    maxlength: [100, 'Hospital name cannot exceed 100 characters'],
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'License number cannot exceed 50 characters'],
  },
  taxId: {
    type: String,
    sparse: true,
    trim: true,
    maxlength: [50, 'Tax ID cannot exceed 50 characters'],
  },
  contact: {
    type: hospitalContactSchema,
    required: [true, 'Contact information is required'],
  },
  address: {
    type: hospitalAddressSchema,
    required: [true, 'Address is required'],
  },
  operatingHours: {
    type: operatingHoursSchema,
    required: [true, 'Operating hours are required'],
  },
  capabilities: {
    type: hospitalCapabilitiesSchema,
    required: [true, 'Capabilities information is required'],
  },
  settings: {
    type: hospitalSettingsSchema,
    required: [true, 'Settings are required'],
  },
  branding: brandingSchema,
  mobileFields: {
    type: mobileFieldsSchema,
    required: [true, 'Mobile fields are required'],
  },
  status: {
    type: hospitalStatusSchema,
    required: [true, 'Status information is required'],
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
hospitalSchema.index({ hospitalId: 1 }, { unique: true });
hospitalSchema.index({ licenseNumber: 1 }, { unique: true });

// Basic operational indexes
hospitalSchema.index({ hospitalType: 1, 'status.isActive': 1 });
hospitalSchema.index({ 'status.isActive': 1, 'status.isVerified': 1 });
hospitalSchema.index({ attachedLabs: 1 }, { sparse: true });

// Location-based indexes
hospitalSchema.index({ 'address.city': 1, 'address.state': 1 });
hospitalSchema.index({ 'address.coordinates': '2dsphere' });

// Mobile app optimization indexes
hospitalSchema.index({ 
  'mobileFields.averageRating': -1, 
  'mobileFields.reviewCount': -1 
});
hospitalSchema.index({ 'mobileFields.priceRange': 1 });

// Text search index for name, city, state
hospitalSchema.index({
  name: 'text',
  'address.city': 'text',
  'address.state': 'text',
  departments: 'text',
  'capabilities.services': 'text',
  'capabilities.specializations': 'text'
});

// Compound indexes for common queries
hospitalSchema.index({ 
  hospitalType: 1, 
  'address.city': 1, 
  'status.isActive': 1 
});
hospitalSchema.index({ 
  emergencyServices: 1, 
  'address.city': 1 
});
hospitalSchema.index({ 
  'settings.allowOnlineBooking': 1, 
  'status.isActive': 1 
});

// Metadata indexes
hospitalSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });
hospitalSchema.index({ 'metadata.createdAt': -1 });

// ====================== VIRTUAL PROPERTIES ======================

hospitalSchema.virtual('isEmergencyHospital').get(function () {
  return this.emergencyServices && this.status.isActive;
});

hospitalSchema.virtual('hasAttachedLabs').get(function () {
  return this.attachedLabs && this.attachedLabs.length > 0;
});

hospitalSchema.virtual('totalRating').get(function () {
  return this.mobileFields.averageRating * this.mobileFields.reviewCount;
});

hospitalSchema.virtual('occupancyRate').get(function () {
  // This would be calculated based on current admissions
  // For now, return null as it requires additional data
  return null;
});

hospitalSchema.virtual('isFullyAccredited').get(function () {
  return this.accreditation.nabh && this.accreditation.nabl;
});

hospitalSchema.virtual('acceptsOnlineBooking').get(function () {
  return this.settings.allowOnlineBooking && this.status.isActive;
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
hospitalSchema.pre('save', async function (next) {
  // Auto-generate hospitalId if not provided
  if (this.isNew && !this.hospitalId) {
    this.hospitalId = await generateHospitalId();
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Validate ICU beds don't exceed total bed capacity
  if (this.icuBeds && this.bedCapacity && this.icuBeds > this.bedCapacity) {
    throw new Error('ICU beds cannot exceed total bed capacity');
  }

  // Auto-update mobile fields based on capabilities
  if (this.isModified('capabilities')) {
    if (!this.mobileFields.services || this.mobileFields.services.length === 0) {
      this.mobileFields.services = this.capabilities.services?.slice(0, 20) || [];
    }
  }

  next();
});

// Pre-validate middleware
hospitalSchema.pre('validate', function (next) {
  // Normalize contact information
  if (this.contact.email) {
    this.contact.email = this.contact.email.toLowerCase().trim();
  }

  // Ensure emergency services hospitals have emergency contact
  if (this.emergencyServices && !this.contact.emergencyContact) {
    this.invalidate('contact.emergencyContact', 'Emergency hospitals must have emergency contact');
  }

  next();
});

// Post-save middleware for logging
hospitalSchema.post('save', function (doc, next) {
  console.log(`Hospital ${doc.name} (${doc.hospitalId}) has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
hospitalSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

hospitalSchema.methods.addAttachedLab = function (labId: Types.ObjectId) {
  if (!this.attachedLabs) {
    this.attachedLabs = [];
  }
  
  if (!this.attachedLabs.includes(labId) && this.attachedLabs.length < 10) {
    this.attachedLabs.push(labId);
    return this.save();
  }
  
  return Promise.resolve(this);
};

hospitalSchema.methods.removeAttachedLab = function (labId: Types.ObjectId) {
  if (this.attachedLabs) {
    this.attachedLabs = this.attachedLabs.filter(id => !id.equals(labId));
    return this.save();
  }
  return Promise.resolve(this);
};

hospitalSchema.methods.updateCapacity = function (bedCapacity: number, icuBeds?: number) {
  this.bedCapacity = bedCapacity;
  if (icuBeds !== undefined) {
    if (icuBeds > bedCapacity) {
      throw new Error('ICU beds cannot exceed total bed capacity');
    }
    this.icuBeds = icuBeds;
  }
  return this.save();
};

hospitalSchema.methods.updateRating = function (newRating: number) {
  const totalRating = this.mobileFields.averageRating * this.mobileFields.reviewCount;
  this.mobileFields.reviewCount += 1;
  this.mobileFields.averageRating = (totalRating + newRating) / this.mobileFields.reviewCount;
  return this.save();
};

hospitalSchema.methods.addDepartment = function (department: string) {
  if (!this.departments) {
    this.departments = [];
  }
  
  if (!this.departments.includes(department) && this.departments.length < 50) {
    this.departments.push(department);
    return this.save();
  }
  
  return Promise.resolve(this);
};

hospitalSchema.methods.updateAccreditation = function (accreditation: Partial<IAccreditation>) {
  this.accreditation = {
    ...this.accreditation,
    ...accreditation,
  };
  return this.save();
};

hospitalSchema.methods.verify = function (verifiedBy?: Types.ObjectId) {
  this.status.isVerified = true;
  this.status.verifiedAt = new Date();
  if (verifiedBy) {
    this.metadata.updatedBy = verifiedBy;
  }
  return this.save();
};

hospitalSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

hospitalSchema.statics.findByHospitalId = function (hospitalId: string) {
  return this.findOne({ hospitalId });
};

hospitalSchema.statics.findByLicenseNumber = function (licenseNumber: string) {
  return this.findOne({ licenseNumber });
};

hospitalSchema.statics.findActiveHospitals = function (filter: any = {}) {
  return this.find({ ...filter, 'status.isActive': true });
};

hospitalSchema.statics.findByCity = function (city: string) {
  return this.find({ 'address.city': new RegExp(city, 'i'), 'status.isActive': true });
};

hospitalSchema.statics.findByType = function (hospitalType: HospitalType) {
  return this.find({ hospitalType, 'status.isActive': true });
};

hospitalSchema.statics.findEmergencyHospitals = function (city?: string) {
  const query: any = { 
    emergencyServices: true, 
    'status.isActive': true 
  };
  
  if (city) {
    query['address.city'] = new RegExp(city, 'i');
  }
  
  return this.find(query);
};

hospitalSchema.statics.findNearby = function (
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

hospitalSchema.statics.findWithAttachedLabs = function () {
  return this.find({
    attachedLabs: { $exists: true, $not: { $size: 0 } },
    'status.isActive': true,
  }).populate('attachedLabs');
};

// ====================== HELPER FUNCTIONS ======================

async function generateHospitalId(): Promise<string> {
  const Hospital = model<IHospital>('Hospital');
  let hospitalId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    hospitalId = `HSP${timestamp}${random}`;
    exists = await Hospital.exists({ hospitalId });
  } while (exists);

  return hospitalId;
}

// ====================== MODEL EXPORT ======================

export const Hospital: Model<IHospital> = model<IHospital>('Hospital', hospitalSchema);
export default Hospital;