import { Schema, model, Document, Types } from 'mongoose';
import {
  Clinic,
  ClinicContact,
  ClinicOperatingHours,
  ClinicFacilities,
  ClinicStatus,
} from '../interfaces/Clinic.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface ClinicMongoDoc extends Document, Omit<Clinic, '_id' | 'preferredLabs'> {
  preferredLabs?: Types.ObjectId[];

  // Document methods
  generateClinicId(): Promise<string>;
  getOperatingStatus(): { isOpen: boolean; nextChange?: string };
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const ClinicContactSchema = new Schema<ClinicContact>(
  {
    phone: { type: String, required: true, match: /^\+?[1-9]\d{1,14}$/ },
    email: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    website: { type: String, match: /^https?:\/\/.*/ },
    emergencyNumber: { type: String, match: /^\+?[1-9]\d{1,14}$/ },
  },
  { _id: false }
);

const OperatingHoursSchema = new Schema(
  {
    open: String,
    close: String,
  },
  { _id: false }
);

const ClinicOperatingHoursSchema = new Schema<ClinicOperatingHours>(
  {
    monday: OperatingHoursSchema,
    tuesday: OperatingHoursSchema,
    wednesday: OperatingHoursSchema,
    thursday: OperatingHoursSchema,
    friday: OperatingHoursSchema,
    saturday: OperatingHoursSchema,
    sunday: OperatingHoursSchema,
  },
  { _id: false }
);

const ClinicFacilitiesSchema = new Schema<ClinicFacilities>(
  {
    consultationRooms: { type: Number, default: 1, min: 1 },
    pharmacy: { type: Boolean, default: false },
    minorProcedures: { type: Boolean, default: false },
    vaccination: { type: Boolean, default: true },
    diagnostics: { type: Boolean, default: false },
  },
  { _id: false }
);

const ClinicStatusSchema = new Schema<ClinicStatus>(
  {
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

// Main Clinic Schema
const ClinicSchema = new Schema<ClinicMongoDoc>({
  clinicId: {
    type: String,
    match: /^CLN\d{8}$/,
    required: true,
  },
  clinicType: {
    type: String,
    enum: ['general', 'specialty', 'polyclinic', 'daycare', 'urgent'],
    required: true,
  },
  specialties: [String],
  name: { type: String, required: true, trim: true },
  licenseNumber: { type: String, required: true, trim: true },
  taxId: { type: String, trim: true },
  contact: { type: ClinicContactSchema, required: true },
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
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere',
      },
    },
  },
  operatingHours: { type: ClinicOperatingHoursSchema, required: true },
  facilities: { type: ClinicFacilitiesSchema, required: true },
  preferredLabs: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Lab',
      validate: {
        validator: function (v: Types.ObjectId[]) {
          return !v || v.length <= 5;
        },
        message: 'Cannot have more than 5 preferred labs',
      },
    },
  ],
  status: { type: ClinicStatusSchema, required: true },

  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware
ClinicSchema.pre('save', function () {
  if (this.isModified() && !this.isNew) {
    (this as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
});

// Methods
ClinicSchema.methods['generateClinicId'] = async function (): Promise<string> {
  return await generateIdWithErrorHandling('CLN', 'Clinic', 'clinicId');
};

ClinicSchema.methods['getOperatingStatus'] = function (): { isOpen: boolean; nextChange?: string } {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    now.getDay()
  ];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todayHours = this['operatingHours'][currentDay as keyof typeof this.operatingHours];

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
    nextChange: isOpen ? todayHours.close : todayHours.open,
  };
};

ClinicSchema.methods['softDelete'] = function () {
  this['status'].isActive = false;
  return this['save']();
};

ClinicSchema.methods['restore'] = function () {
  this['status'].isActive = true;
  return this['save']();
};

// Pre-save middleware for clinicId generation
ClinicSchema.pre('save', async function () {
  if (this.isNew && !(this as unknown as { clinicId: string }).clinicId) {
    (this as unknown as { clinicId: string }).clinicId = await generateIdWithErrorHandling('CLN', 'Clinic', 'clinicId');
  }
});

// Indexes
ClinicSchema.index({ clinicId: 1 }, { unique: true });
ClinicSchema.index({ licenseNumber: 1 }, { unique: true });
ClinicSchema.index({ clinicType: 1, 'status.isActive': 1 });
ClinicSchema.index({ specialties: 1 });
ClinicSchema.index({ preferredLabs: 1 });
ClinicSchema.index({ 'address.city': 1, 'address.state': 1 });
ClinicSchema.index({ 'address.coordinates': '2dsphere' });
ClinicSchema.index({ name: 'text', specialties: 'text' });

export const ClinicModel = model<ClinicMongoDoc>('Clinic', ClinicSchema);
