import { Schema, model, Document, Types } from 'mongoose';
import { Gender, BloodGroup } from '../types/enums.js';
import { Patient, PatientProfile, MedicalHistory, InsuranceInfo, ReferralInfo } from '../interfaces/Patient.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface PatientMongoDoc 
  extends Document,
    Omit<Patient, '_id' | 'registeredBy' | 'currentReferralSource'> {
  registeredBy?: Types.ObjectId;
  currentReferralSource?: Omit<ReferralInfo, 'referredBy' | 'referralTests'> & {
    referredBy?: Types.ObjectId;
    referralTests?: Types.ObjectId[];
  };
  
  // Document methods
  generatePatientId(): Promise<string>;
  getFullName(): string;
  getAge(): number;
  addMedicalHistory(type: keyof MedicalHistory, value: string): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const PatientProfileSchema = new Schema<PatientProfile>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: Object.values(Gender), required: true },
  bloodGroup: { type: String, enum: Object.values(BloodGroup) },
  mobileNumber: { 
    type: String, 
    match: /^\+?[1-9]\d{1,14}$/,
    sparse: true 
  },
  email: {
    type: String,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    sparse: true
  },
  profilePicture: { type: String, maxlength: 500 },
  address: {
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
  },
  guardianName: { type: String, trim: true },
  guardianPhone: { type: String },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, required: true }
  }
}, { _id: false });

const MedicalHistorySchema = new Schema<MedicalHistory>({
  allergies: [{ type: String, maxlength: 100 }],
  medications: [{ type: String, maxlength: 100 }],
  medicalConditions: [{ type: String, maxlength: 100 }],
  surgicalHistory: [{ type: String, maxlength: 200 }],
  familyHistory: [{ type: String, maxlength: 200 }],
  smokingStatus: { 
    type: String, 
    enum: ['never', 'former', 'current'],
    default: 'never'
  },
  alcoholConsumption: { 
    type: String, 
    enum: ['never', 'occasional', 'regular'],
    default: 'never'
  }
}, { _id: false });

const InsuranceInfoSchema = new Schema<InsuranceInfo>({
  providerName: String,
  policyNumber: String,
  groupNumber: String,
  validUntil: Date
}, { _id: false });

const ReferralInfoSchema = new Schema({
  referredBy: { type: Schema.Types.ObjectId },
  referredByType: { 
    type: String, 
    enum: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic']
  },
  referredByName: String,
  referralDate: Date,
  referralReason: { type: String, maxlength: 500 },
  referralNotes: { type: String, maxlength: 1000 },
  referralTests: [{ type: Schema.Types.ObjectId, ref: 'Test' }]
}, { _id: false });

// Main Patient Schema
const PatientSchema = new Schema<PatientMongoDoc>({
  patientId: { 
    type: String, 
    unique: true, 
    match: /^PAT\d{8}$/,
    required: true
  },
  profile: { type: PatientProfileSchema, required: true },
  medicalHistory: { type: MedicalHistorySchema, default: {} },
  insuranceInfo: InsuranceInfoSchema,
  currentReferralSource: ReferralInfoSchema,
  registeredBy: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
  registeredByType: { 
    type: String, 
    enum: ['hospital', 'lab', 'clinic', 'consumer'],
    sparse: true 
  },
  
  // Statistics
  totalCases: { type: Number, default: 0 },
  totalReports: { type: Number, default: 0 },
  lastVisit: Date,
  
  // Consent flags
  dataSharing: { type: Boolean, default: false },
  researchParticipation: { type: Boolean, default: false },
  marketingCommunication: { type: Boolean, default: false },
  familyAccessConsent: { type: Boolean, default: true },
  consentDate: Date,
  
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
PatientSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods
PatientSchema.methods['generatePatientId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('PAT', 'Patient', 'patientId');
};

PatientSchema.methods['getFullName'] = function(): string {
  return `${this['profile'].firstName} ${this['profile'].lastName}`;
};

PatientSchema.methods['getAge'] = function(): number {
  const today = new Date();
  const birthDate = new Date(this['profile'].dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

PatientSchema.methods['addMedicalHistory'] = function(type: keyof MedicalHistory, value: string) {
  if (!this['medicalHistory'][type]) {
    this['medicalHistory'][type] = [];
  }
  
  if (Array.isArray(this['medicalHistory'][type]) && !this['medicalHistory'][type].includes(value)) {
    this['medicalHistory'][type].push(value);
  }
  
  return this['save']();
};

PatientSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

PatientSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for patientId generation
PatientSchema.pre('save', async function() {
  if (this.isNew && !this['patientId']) {
    this['patientId'] = await generateIdWithErrorHandling('PAT', 'Patient', 'patientId');
  }
});

// Indexes
PatientSchema.index({ patientId: 1 }, { unique: true });
PatientSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text' });
PatientSchema.index({ 'profile.mobileNumber': 1 }, { sparse: true });
PatientSchema.index({ 'profile.email': 1 }, { sparse: true });
PatientSchema.index({ 'profile.dateOfBirth': 1 });
PatientSchema.index({ registeredBy: 1 }, { sparse: true });
PatientSchema.index({ 'profile.address.coordinates': '2dsphere' });

export const PatientModel = model<PatientMongoDoc>('Patient', PatientSchema);