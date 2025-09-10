import { Schema, model, Document, Types } from 'mongoose';
import { Gender, BloodGroup } from '../types/enums.js';
import { 
  Patient, 
  PatientContact, 
  PatientContactAddress, 
  PatientMedicalHistory, 
  PatientInsurance, 
  PatientReferralChainItem, 
  PatientCurrentReferralSource, 
  PatientConsent, 
  PatientStatistics 
} from '../interfaces/Patient.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface PatientMongoDoc 
  extends Document,
    Omit<Patient, '_id' | 'referralChain'> {
  referralChain?: (Omit<PatientReferralChainItem, 'referredBy' | 'referredTo' | 'referralTests'> & {
    referredBy: Types.ObjectId;
    referredTo?: Types.ObjectId;
    referralTests?: Types.ObjectId[];
  })[];
  
  // Document methods
  generatePatientId(): Promise<string>;
  getFullName(): string;
  getAge(): number;
  addMedicalHistory(type: 'allergies' | 'medications' | 'conditions' | 'surgeries', value: string): Promise<this>;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const PatientContactAddressSchema = new Schema<PatientContactAddress>({
  street: { type: String, maxlength: 200 },
  city: { type: String, maxlength: 100 },
  state: { type: String, maxlength: 100 },
  zipCode: { type: String, match: /^[0-9]{5,10}$/ },
  country: { type: String, default: 'India' }
}, { _id: false });

const PatientContactSchema = new Schema<PatientContact>({
  mobileNumber: { 
    type: String, 
    required: true,
    match: /^\+?[1-9]\d{1,14}$/
  },
  alternateNumber: { 
    type: String, 
    match: /^\+?[1-9]\d{1,14}$/,
    sparse: true 
  },
  email: {
    type: String,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  address: PatientContactAddressSchema
}, { _id: false });

const PatientMedicalHistorySchema = new Schema<PatientMedicalHistory>({
  allergies: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(arr: string[]) {
        return !arr || arr.length <= 20;
      },
      message: 'Cannot have more than 20 allergies'
    }
  }],
  medications: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(arr: string[]) {
        return !arr || arr.length <= 20;
      },
      message: 'Cannot have more than 20 medications'
    }
  }],
  conditions: [{ 
    type: String, 
    maxlength: 100,
    validate: {
      validator: function(arr: string[]) {
        return !arr || arr.length <= 20;
      },
      message: 'Cannot have more than 20 conditions'
    }
  }],
  surgeries: [{ 
    type: String, 
    maxlength: 200,
    validate: {
      validator: function(arr: string[]) {
        return !arr || arr.length <= 10;
      },
      message: 'Cannot have more than 10 surgeries'
    }
  }],
  familyHistory: { type: Schema.Types.Mixed }
}, { _id: false });

const PatientInsuranceSchema = new Schema<PatientInsurance>({
  provider: String,
  policyNumber: String,
  groupNumber: String,
  validUntil: Date
}, { _id: false });

const PatientReferralChainItemSchema = new Schema({
  referralId: String,
  referredBy: { type: Schema.Types.ObjectId, required: true },
  referredByType: { 
    type: String, 
    enum: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic'],
    required: true
  },
  referredByName: { type: String, required: true },
  referredTo: { type: Schema.Types.ObjectId },
  referredToType: { 
    type: String, 
    enum: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic']
  },
  referralDate: { type: Date, required: true },
  referralReason: { type: String, maxlength: 500 },
  referralNotes: { type: String, maxlength: 1000 },
  referralTests: [{ type: Schema.Types.ObjectId }],
  isActive: { type: Boolean, default: true },
  completedDate: Date
}, { _id: false });

const PatientCurrentReferralSourceSchema = new Schema<PatientCurrentReferralSource>({
  referredBy: { type: Schema.Types.ObjectId },
  referredByType: String,
  referredByName: String,
  referralDate: Date
}, { _id: false });

const PatientConsentSchema = new Schema<PatientConsent>({
  dataSharing: { type: Boolean, required: true },
  researchParticipation: { type: Boolean, required: true },
  marketingCommunication: { type: Boolean, required: true },
  familyAccessConsent: { type: Boolean, required: true },
  consentDate: Date
}, { _id: false });

const PatientStatisticsSchema = new Schema<PatientStatistics>({
  totalCases: { type: Number, required: true },
  totalReports: { type: Number, required: true },
  lastVisit: Date
}, { _id: false });

// Main Patient Schema
const PatientSchema = new Schema<PatientMongoDoc>({
  patientId: { 
    type: String, 
    match: /^PAT\d{8}$/,
    required: true
  },
  mrn: { type: String },
  primaryUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  authorizedUsers: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    validate: {
      validator: function(v: Types.ObjectId[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 authorized users'
    }
  }],
  linkedConsumerAccount: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
  
  // Demographics fields
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: Object.values(Gender), required: true },
  bloodGroup: { 
    type: String, 
    enum: [...Object.values(BloodGroup), 'Unknown'],
    sparse: true 
  },
  
  contact: { type: PatientContactSchema, required: true },
  medicalHistory: PatientMedicalHistorySchema,
  insurance: PatientInsuranceSchema,
  referralChain: [{
    type: PatientReferralChainItemSchema,
    validate: {
      validator: function(v: unknown[]) {
        return !v || v.length <= 50;
      },
      message: 'Cannot have more than 50 referral chain items'
    }
  }],
  currentReferralSource: PatientCurrentReferralSourceSchema,
  consent: PatientConsentSchema,
  statistics: PatientStatisticsSchema,
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'deceased'],
    required: true,
    default: 'active'
  },
  
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
  }
});

// Middleware
PatientSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
PatientSchema.methods['generatePatientId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('PAT', 'Patient', 'patientId');
};

PatientSchema.methods['getFullName'] = function(): string {
  return `${this['firstName']} ${this['lastName']}`;
};

PatientSchema.methods['getAge'] = function(): number {
  const today = new Date();
  const birthDate = new Date(this['dateOfBirth']);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

PatientSchema.methods['addMedicalHistory'] = function(type: 'allergies' | 'medications' | 'conditions' | 'surgeries', value: string) {
  if (!this['medicalHistory']) {
    this['medicalHistory'] = {};
  }
  
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
  this['status'] = 'inactive';
  return this['save']();
};

PatientSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['status'] = 'active';
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
PatientSchema.index({ mrn: 1 }, { unique: true, sparse: true });
PatientSchema.index({ firstName: 'text', lastName: 'text' });
PatientSchema.index({ 'contact.mobileNumber': 1 });
PatientSchema.index({ 'contact.email': 1 }, { sparse: true });
PatientSchema.index({ dateOfBirth: 1 });
PatientSchema.index({ primaryUserId: 1 }, { sparse: true });
PatientSchema.index({ authorizedUsers: 1 }, { sparse: true });
PatientSchema.index({ 'referralChain.referredBy': 1, 'referralChain.isActive': 1 });
PatientSchema.index({ 'currentReferralSource.referredBy': 1 }, { sparse: true });
PatientSchema.index({ status: 1 });

export const PatientModel = model<PatientMongoDoc>('Patient', PatientSchema);