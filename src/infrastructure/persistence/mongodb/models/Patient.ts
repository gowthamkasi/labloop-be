/**
 * Patient Model for LabLoop Healthcare System
 * Patient records with enhanced user relationships and comprehensive referral tracking
 * HIPAA-compliant with audit logging and consent management
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  IPatient, 
  IPatientDemographics,
  IPatientContact,
  IMedicalHistory,
  IInsurance,
  IReferralChain,
  ICurrentReferralSource,
  IPatientConsent,
  IPatientStatistics,
  PatientStatus,
  Gender,
  BloodGroup,
  ReferralType,
  IAddress
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const addressSchema = new Schema<IAddress>({
  street: {
    type: String,
    maxlength: [200, 'Street address cannot exceed 200 characters'],
    trim: true,
  },
  city: {
    type: String,
    maxlength: [100, 'City name cannot exceed 100 characters'],
    trim: true,
  },
  state: {
    type: String,
    maxlength: [100, 'State name cannot exceed 100 characters'],
    trim: true,
  },
  zipCode: {
    type: String,
    validate: {
      validator: (zip: string) => !zip || /^[0-9]{5,10}$/.test(zip),
      message: 'ZIP code must be 5-10 digits',
    },
  },
  country: {
    type: String,
    default: 'India',
    trim: true,
  },
}, { _id: false });

const patientDemographicsSchema = new Schema<IPatientDemographics>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: (date: Date) => {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age <= 120 && date < today;
      },
      message: 'Date of birth must be a valid past date',
    },
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other'] as Gender[],
      message: 'Gender must be male, female, or other',
    },
  },
  bloodGroup: {
    type: String,
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as BloodGroup[],
      message: 'Invalid blood group',
    },
  },
}, { _id: false });

const patientContactSchema = new Schema<IPatientContact>({
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Please provide a valid mobile number',
    },
  },
  alternateNumber: {
    type: String,
    validate: {
      validator: (phone: string) => !phone || /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Alternate number must be valid',
    },
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => {
        return !email || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      },
      message: 'Please provide a valid email address',
    },
  },
  address: addressSchema,
}, { _id: false });

const medicalHistorySchema = new Schema<IMedicalHistory>({
  allergies: {
    type: [String],
    validate: {
      validator: (allergies: string[]) => allergies.length <= 20,
      message: 'Cannot have more than 20 allergies',
    },
  },
  medications: {
    type: [String],
    validate: {
      validator: (medications: string[]) => medications.length <= 20,
      message: 'Cannot have more than 20 medications',
    },
  },
  conditions: {
    type: [String],
    validate: {
      validator: (conditions: string[]) => conditions.length <= 20,
      message: 'Cannot have more than 20 medical conditions',
    },
  },
  surgeries: {
    type: [String],
    validate: {
      validator: (surgeries: string[]) => surgeries.length <= 10,
      message: 'Cannot have more than 10 surgeries',
    },
  },
  familyHistory: {
    type: Schema.Types.Mixed,
    validate: {
      validator: function(value: any) {
        if (!value) return true;
        // Simple size check - in real implementation, you might want more sophisticated validation
        return JSON.stringify(value).length <= 2048; // ~2KB
      },
      message: 'Family history data too large (max 2KB)',
    },
  },
}, { _id: false });

const insuranceSchema = new Schema<IInsurance>({
  provider: {
    type: String,
    trim: true,
    maxlength: [100, 'Insurance provider name too long'],
  },
  policyNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Policy number too long'],
  },
  groupNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Group number too long'],
  },
  validUntil: {
    type: Date,
    validate: {
      validator: (date: Date) => !date || date > new Date(),
      message: 'Insurance validity date must be in the future',
    },
  },
}, { _id: false });

const referralChainSchema = new Schema<IReferralChain>({
  referralId: {
    type: String,
    required: [true, 'Referral ID is required'],
    validate: {
      validator: (id: string) => /^REF[0-9]{8}$/.test(id),
      message: 'Referral ID must follow pattern REF followed by 8 digits',
    },
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Referrer is required'],
    refPath: 'referralChain.referredByType',
  },
  referredByType: {
    type: String,
    required: [true, 'Referrer type is required'],
    enum: {
      values: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic'] as ReferralType[],
      message: 'Invalid referrer type',
    },
  },
  referredByName: {
    type: String,
    required: [true, 'Referrer name is required'],
    trim: true,
    maxlength: [100, 'Referrer name too long'],
  },
  referredTo: {
    type: Schema.Types.ObjectId,
    refPath: 'referralChain.referredToType',
  },
  referredToType: {
    type: String,
    enum: {
      values: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic'] as ReferralType[],
      message: 'Invalid referee type',
    },
  },
  referralDate: {
    type: Date,
    required: [true, 'Referral date is required'],
    default: Date.now,
  },
  referralReason: {
    type: String,
    maxlength: [500, 'Referral reason cannot exceed 500 characters'],
    trim: true,
  },
  referralNotes: {
    type: String,
    maxlength: [1000, 'Referral notes cannot exceed 1000 characters'],
    trim: true,
  },
  referralTests: {
    type: [Schema.Types.ObjectId],
    ref: 'tests',
    validate: {
      validator: (tests: Types.ObjectId[]) => tests.length <= 50,
      message: 'Cannot refer more than 50 tests',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  completedDate: {
    type: Date,
    validate: {
      validator: function(this: IReferralChain, date: Date) {
        return !date || date >= this.referralDate;
      },
      message: 'Completion date cannot be before referral date',
    },
  },
}, { _id: false });

const currentReferralSourceSchema = new Schema<ICurrentReferralSource>({
  referredBy: {
    type: Schema.Types.ObjectId,
    refPath: 'currentReferralSource.referredByType',
  },
  referredByType: {
    type: String,
    enum: {
      values: ['hospital', 'lab', 'doctor', 'collectionCenter', 'clinic'] as ReferralType[],
      message: 'Invalid referrer type',
    },
  },
  referredByName: {
    type: String,
    trim: true,
    maxlength: [100, 'Referrer name too long'],
  },
  referralDate: {
    type: Date,
  },
}, { _id: false });

const patientConsentSchema = new Schema<IPatientConsent>({
  dataSharing: {
    type: Boolean,
    default: false,
  },
  researchParticipation: {
    type: Boolean,
    default: false,
  },
  marketingCommunication: {
    type: Boolean,
    default: false,
  },
  familyAccessConsent: {
    type: Boolean,
    default: true,
  },
  consentDate: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const patientStatisticsSchema = new Schema<IPatientStatistics>({
  totalCases: {
    type: Number,
    default: 0,
    min: [0, 'Total cases cannot be negative'],
  },
  totalReports: {
    type: Number,
    default: 0,
    min: [0, 'Total reports cannot be negative'],
  },
  lastVisit: {
    type: Date,
  },
}, { _id: false });

// ====================== MAIN PATIENT SCHEMA ======================

const patientSchema = new Schema<IPatient>({
  patientId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (patientId: string) => /^PAT[0-9]{6}$/.test(patientId),
      message: 'Patient ID must follow pattern PAT followed by 6 digits',
    },
  },
  mrn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [20, 'MRN cannot exceed 20 characters'],
  },
  primaryUserId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    sparse: true,
  },
  authorizedUsers: {
    type: [Schema.Types.ObjectId],
    ref: 'users',
    validate: {
      validator: (users: Types.ObjectId[]) => users.length <= 10,
      message: 'Cannot authorize more than 10 users',
    },
  },
  linkedConsumerAccount: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    sparse: true,
  },
  demographics: {
    type: patientDemographicsSchema,
    required: [true, 'Patient demographics are required'],
  },
  contact: {
    type: patientContactSchema,
    required: [true, 'Patient contact information is required'],
  },
  medicalHistory: medicalHistorySchema,
  insurance: insuranceSchema,
  referralChain: {
    type: [referralChainSchema],
    validate: {
      validator: (chain: IReferralChain[]) => chain.length <= 50,
      message: 'Referral chain cannot exceed 50 entries',
    },
  },
  currentReferralSource: currentReferralSourceSchema,
  consent: {
    type: patientConsentSchema,
    required: [true, 'Patient consent information is required'],
  },
  statistics: {
    type: patientStatisticsSchema,
    required: [true, 'Patient statistics are required'],
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'deceased'] as PatientStatus[],
      message: 'Invalid patient status',
    },
    default: 'active',
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
patientSchema.index({ patientId: 1 }, { unique: true });
patientSchema.index({ mrn: 1 }, { unique: true, sparse: true });

// User relationship indexes
patientSchema.index({ primaryUserId: 1 }, { sparse: true });
patientSchema.index({ authorizedUsers: 1 }, { sparse: true });
patientSchema.index({ linkedConsumerAccount: 1 }, { sparse: true });

// Referral tracking indexes
patientSchema.index({ 'referralChain.referredBy': 1, 'referralChain.isActive': 1 });
patientSchema.index({ 'currentReferralSource.referredBy': 1 });
patientSchema.index({ 'currentReferralSource.referredByType': 1 });

// Demographics and contact indexes
patientSchema.index({ 'demographics.dateOfBirth': 1 });
patientSchema.index({ 'demographics.gender': 1 });
patientSchema.index({ 'demographics.bloodGroup': 1 });
patientSchema.index({ 'contact.mobileNumber': 1 });

// Status and metadata indexes
patientSchema.index({ status: 1, 'metadata.createdAt': -1 });
patientSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });

// Text search index
patientSchema.index({
  'demographics.firstName': 'text',
  'demographics.lastName': 'text',
  patientId: 'text',
  mrn: 'text',
  'contact.email': 'text'
});

// Compound indexes for common queries
patientSchema.index({ 'demographics.gender': 1, 'demographics.bloodGroup': 1 });
patientSchema.index({ status: 1, 'demographics.dateOfBirth': 1 });

// ====================== VIRTUAL PROPERTIES ======================

patientSchema.virtual('fullName').get(function () {
  return `${this.demographics.firstName} ${this.demographics.lastName}`;
});

patientSchema.virtual('age').get(function () {
  if (!this.demographics.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.demographics.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

patientSchema.virtual('isMinor').get(function () {
  const age = this.age;
  return age !== null && age < 18;
});

patientSchema.virtual('activeReferrals').get(function () {
  return this.referralChain?.filter((referral: IReferralChain) => referral.isActive) || [];
});

patientSchema.virtual('hasInsurance').get(function () {
  return this.insurance && this.insurance.provider && this.insurance.policyNumber;
});

patientSchema.virtual('isInsuranceValid').get(function () {
  return this.hasInsurance && 
         (!this.insurance.validUntil || this.insurance.validUntil > new Date());
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
patientSchema.pre('save', async function (next) {
  // Auto-generate patientId if not provided
  if (this.isNew && !this.patientId) {
    this.patientId = await generatePatientId();
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Update current referral source when referral chain is modified
  if (this.isModified('referralChain') && this.referralChain && this.referralChain.length > 0) {
    const activeReferrals = this.referralChain.filter((ref: IReferralChain) => ref.isActive);
    if (activeReferrals.length > 0) {
      const latestReferral = activeReferrals.sort((a, b) => 
        new Date(b.referralDate).getTime() - new Date(a.referralDate).getTime()
      )[0];
      
      this.currentReferralSource = {
        referredBy: latestReferral.referredBy,
        referredByType: latestReferral.referredByType,
        referredByName: latestReferral.referredByName,
        referralDate: latestReferral.referralDate,
      };
    }
  }

  next();
});

// Pre-validate middleware
patientSchema.pre('validate', function (next) {
  // Normalize contact information
  if (this.contact.email) {
    this.contact.email = this.contact.email.toLowerCase().trim();
  }

  // Generate referral IDs for new referrals
  if (this.referralChain) {
    this.referralChain.forEach((referral: IReferralChain) => {
      if (!referral.referralId) {
        referral.referralId = generateReferralId();
      }
    });
  }

  next();
});

// Post-save middleware for logging
patientSchema.post('save', function (doc, next) {
  console.log(`Patient ${doc.fullName} (${doc.patientId}) has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
patientSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

patientSchema.methods.addReferral = function (referralData: Omit<IReferralChain, 'referralId' | 'isActive'>) {
  if (!this.referralChain) {
    this.referralChain = [];
  }
  
  const referral: IReferralChain = {
    ...referralData,
    referralId: generateReferralId(),
    isActive: true,
  };
  
  this.referralChain.push(referral);
  return this.save();
};

patientSchema.methods.completeReferral = function (referralId: string, completedDate?: Date) {
  if (this.referralChain) {
    const referral = this.referralChain.find((ref: IReferralChain) => ref.referralId === referralId);
    if (referral) {
      referral.isActive = false;
      referral.completedDate = completedDate || new Date();
      return this.save();
    }
  }
  return Promise.resolve(this);
};

patientSchema.methods.addAuthorizedUser = function (userId: Types.ObjectId) {
  if (!this.authorizedUsers) {
    this.authorizedUsers = [];
  }
  
  if (!this.authorizedUsers.includes(userId) && this.authorizedUsers.length < 10) {
    this.authorizedUsers.push(userId);
    return this.save();
  }
  
  return Promise.resolve(this);
};

patientSchema.methods.removeAuthorizedUser = function (userId: Types.ObjectId) {
  if (this.authorizedUsers) {
    this.authorizedUsers = this.authorizedUsers.filter(id => !id.equals(userId));
    return this.save();
  }
  return Promise.resolve(this);
};

patientSchema.methods.updateConsent = function (consentUpdates: Partial<IPatientConsent>) {
  this.consent = {
    ...this.consent,
    ...consentUpdates,
    consentDate: new Date(),
  };
  return this.save();
};

patientSchema.methods.incrementCaseCount = function () {
  this.statistics.totalCases += 1;
  return this.save();
};

patientSchema.methods.incrementReportCount = function () {
  this.statistics.totalReports += 1;
  return this.save();
};

patientSchema.methods.updateLastVisit = function (visitDate?: Date) {
  this.statistics.lastVisit = visitDate || new Date();
  return this.save();
};

patientSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

patientSchema.methods.anonymize = function () {
  // GDPR compliance - anonymize patient data
  this.demographics.firstName = 'ANONYMIZED';
  this.demographics.lastName = 'PATIENT';
  this.contact.email = null;
  this.contact.mobileNumber = 'XXXXXXXXXX';
  this.contact.alternateNumber = null;
  this.contact.address = {};
  this.medicalHistory = {};
  this.insurance = {};
  
  return this.save();
};

// ====================== STATIC METHODS ======================

patientSchema.statics.findByPatientId = function (patientId: string) {
  return this.findOne({ patientId });
};

patientSchema.statics.findByMRN = function (mrn: string) {
  return this.findOne({ mrn });
};

patientSchema.statics.findByMobileNumber = function (mobileNumber: string) {
  return this.findOne({ 'contact.mobileNumber': mobileNumber });
};

patientSchema.statics.findActivePatients = function (filter: any = {}) {
  return this.find({ ...filter, status: 'active' });
};

patientSchema.statics.findByAge = function (minAge: number, maxAge: number) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
  
  return this.find({
    'demographics.dateOfBirth': {
      $gte: minDate,
      $lte: maxDate
    }
  });
};

patientSchema.statics.findByBloodGroup = function (bloodGroup: string) {
  return this.find({ 'demographics.bloodGroup': bloodGroup });
};

patientSchema.statics.findByReferralSource = function (referredBy: Types.ObjectId, referredByType?: string) {
  const query: any = { 'currentReferralSource.referredBy': referredBy };
  if (referredByType) {
    query['currentReferralSource.referredByType'] = referredByType;
  }
  return this.find(query);
};

// ====================== HELPER FUNCTIONS ======================

async function generatePatientId(): Promise<string> {
  const Patient = model<IPatient>('Patient');
  let patientId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    patientId = `PAT${timestamp}${random}`;
    exists = await Patient.exists({ patientId });
  } while (exists);

  return patientId;
}

function generateReferralId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `REF${timestamp}${random}`;
}

// ====================== MODEL EXPORT ======================

export const Patient: Model<IPatient> = model<IPatient>('Patient', patientSchema);
export default Patient;