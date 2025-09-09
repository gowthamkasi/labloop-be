import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface DoctorAvailability {
  days?: string[];
  timings?: string;
}

export interface OrganizationDoctor {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  doctorId: string;
  name: string;
  specialization: string;
  experience?: number;
  qualifications?: string[];
  registrationNumber?: string;
  availability: DoctorAvailability;
  consultationFee?: number;
  rating?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Document interface
export interface OrganizationDoctorMongoDoc 
  extends Document, 
    Omit<OrganizationDoctor, '_id'> {
  
  // Document methods
  activate(): Promise<this>;
  deactivate(): Promise<this>;
  updateAvailability(availability: Partial<DoctorAvailability>): Promise<this>;
  updateRating(rating: number): Promise<this>;
  addQualification(qualification: string): Promise<this>;
  removeQualification(qualification: string): Promise<this>;
  updateConsultationFee(fee: number): Promise<this>;
  isAvailableOnDay(day: string): boolean;
}

// Embedded Schemas
const DoctorAvailabilitySchema = new Schema<DoctorAvailability>({
  days: [String],
  timings: String
}, { _id: false });

// Main Schema
const OrganizationDoctorSchema = new Schema<OrganizationDoctorMongoDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  doctorId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  experience: {
    type: Number,
    min: 0
  },
  qualifications: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 qualifications'
    }
  },
  registrationNumber: { type: String, trim: true },
  availability: { type: DoctorAvailabilitySchema, required: true },
  consultationFee: {
    type: Number,
    min: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  isActive: { type: Boolean, default: true },
  
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
OrganizationDoctorSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
OrganizationDoctorSchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

OrganizationDoctorSchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

OrganizationDoctorSchema.methods['updateAvailability'] = function(availability: Partial<DoctorAvailability>) {
  Object.assign(this['availability'], availability);
  return this['save']();
};

OrganizationDoctorSchema.methods['updateRating'] = function(rating: number) {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  this['rating'] = rating;
  return this['save']();
};

OrganizationDoctorSchema.methods['addQualification'] = function(qualification: string) {
  if (!this['qualifications']) {
    this['qualifications'] = [];
  }
  
  if (!this['qualifications'].includes(qualification)) {
    this['qualifications'].push(qualification);
  }
  
  return this['save']();
};

OrganizationDoctorSchema.methods['removeQualification'] = function(qualification: string) {
  if (this['qualifications']) {
    this['qualifications'] = this['qualifications'].filter((q: string) => q !== qualification);
  }
  return this['save']();
};

OrganizationDoctorSchema.methods['updateConsultationFee'] = function(fee: number) {
  if (fee < 0) {
    throw new Error('Consultation fee cannot be negative');
  }
  this['consultationFee'] = fee;
  return this['save']();
};

OrganizationDoctorSchema.methods['isAvailableOnDay'] = function(day: string): boolean {
  return this['availability'].days?.includes(day) || false;
};

// Validation
OrganizationDoctorSchema.pre('save', function() {
  // Validate availability days
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  if (this['availability'].days) {
    const invalidDays = this['availability'].days.filter(day => !validDays.includes(day));
    if (invalidDays.length > 0) {
      throw new Error(`Invalid day(s): ${invalidDays.join(', ')}`);
    }
  }
});

// Indexes
OrganizationDoctorSchema.index({ organizationId: 1, isActive: 1 });
OrganizationDoctorSchema.index({ organizationId: 1, doctorId: 1 }, { unique: true });
OrganizationDoctorSchema.index({ specialization: 1 });
OrganizationDoctorSchema.index({ rating: -1 });
OrganizationDoctorSchema.index({ name: 'text', specialization: 'text' });

export const OrganizationDoctorModel = model<OrganizationDoctorMongoDoc>('OrganizationDoctor', OrganizationDoctorSchema);