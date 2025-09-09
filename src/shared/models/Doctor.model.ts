import { Schema, model, Document } from 'mongoose';
import { Gender } from '../types/enums.js';
import { Doctor, DoctorPersonalInfo, DoctorQualifications, DoctorExperience, DoctorContact } from '../interfaces/Doctor.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface - handles differences between TS and Mongo types
export interface DoctorMongoDoc extends Document, Omit<Doctor, '_id'> {
  // Document methods
  generateDoctorId(): Promise<string>;
  getFullName(): string;
  getSpecializationsString(): string;
  getTotalExperience(): number;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const DoctorPersonalInfoSchema = new Schema<DoctorPersonalInfo>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: Object.values(Gender) },
  dateOfBirth: { type: Date },
  profilePhoto: { type: String, maxlength: 500 }
}, { _id: false });

const DoctorQualificationsSchema = new Schema<DoctorQualifications>({
  primaryDegree: { type: String, required: true, trim: true },
  specializations: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 5;
      },
      message: 'Cannot have more than 5 specializations'
    }
  }],
  additionalDegrees: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 additional degrees'
    }
  }],
  boardCertifications: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 5;
      },
      message: 'Cannot have more than 5 board certifications'
    }
  }],
  fellowships: [{ 
    type: String, 
    trim: true,
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 5;
      },
      message: 'Cannot have more than 5 fellowships'
    }
  }]
}, { _id: false });

const DoctorExperienceSchema = new Schema<DoctorExperience>({
  totalYears: { type: Number, min: 0, max: 70 },
  specialtyYears: { type: Number, min: 0, max: 70 },
  currentSpecialty: { type: String, trim: true }
}, { _id: false });

const DoctorContactSchema = new Schema<DoctorContact>({
  mobile: { 
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
  alternatePhone: { 
    type: String, 
    match: /^\+?[1-9]\d{1,14}$/,
    sparse: true 
  }
}, { _id: false });

// Main Doctor Schema
const DoctorSchema = new Schema<DoctorMongoDoc>({
  doctorId: { 
    type: String, 
    unique: true, 
    match: /^DOC\d{6}$/,
    required: true
  },
  registrationNumber: { 
    type: String, 
    unique: true, 
    required: true,
    trim: true,
    uppercase: true
  },
  personalInfo: { type: DoctorPersonalInfoSchema, required: true },
  qualifications: { type: DoctorQualificationsSchema, required: true },
  experience: DoctorExperienceSchema,
  contact: { type: DoctorContactSchema, required: true },
  
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
    type: String,
    sparse: true
  },
  updatedBy: {
    type: String,
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
DoctorSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods using bracket notation for TypeScript strict mode
DoctorSchema.methods['generateDoctorId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('DOC', 'Doctor', 'doctorId');
};

DoctorSchema.methods['getFullName'] = function(): string {
  return `${this['personalInfo'].firstName} ${this['personalInfo'].lastName}`;
};

DoctorSchema.methods['getSpecializationsString'] = function(): string {
  const specs = this['qualifications'].specializations;
  return specs && specs.length > 0 ? specs.join(', ') : 'General Practice';
};

DoctorSchema.methods['getTotalExperience'] = function(): number {
  return this['experience']?.totalYears || 0;
};

DoctorSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

DoctorSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for doctorId generation
DoctorSchema.pre('save', async function() {
  if (this.isNew && !this['doctorId']) {
    this['doctorId'] = await generateIdWithErrorHandling('DOC', 'Doctor', 'doctorId');
  }
});

// Indexes
DoctorSchema.index({ doctorId: 1 }, { unique: true });
DoctorSchema.index({ registrationNumber: 1 }, { unique: true });
DoctorSchema.index({ 'contact.email': 1 }, { unique: true });
DoctorSchema.index({ 'contact.mobile': 1 });
DoctorSchema.index({ 'qualifications.specializations': 1 });
DoctorSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
DoctorSchema.index({ 'experience.currentSpecialty': 1 });
DoctorSchema.index({ isActive: 1 });

export const DoctorModel = model<DoctorMongoDoc>('Doctor', DoctorSchema);