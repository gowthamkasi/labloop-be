import { Schema, model, Types, Document } from 'mongoose';

// Enums
export enum UserType {
  B2B = 'b2b',
  B2C = 'b2c'
}

export enum UserRole {
  // B2B Roles
  ADMIN = 'admin',
  LAB_MANAGER = 'labManager', 
  TECHNICIAN = 'technician',
  COLLECTION_AGENT = 'collectionAgent',
  RECEPTIONIST = 'receptionist',
  QUALITY_CONTROLLER = 'qualityController',
  LAB_ASSISTANT = 'labAssistant',
  
  // B2C Roles
  CONSUMER = 'consumer',
  FAMILY_MANAGER = 'familyManager'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female', 
  OTHER = 'other'
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-'
}

// Interfaces
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: Gender;
  mobileNumber?: string;
  profilePicture?: string;
  address?: Address;
}

export interface HealthProfile {
  height?: number; // cm
  weight?: number; // kg
  bloodGroup?: BloodGroup;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface Employment {
  organizationId?: Types.ObjectId;
  designation?: string;
  department?: string;
  joiningDate?: Date;
  reportingTo?: Types.ObjectId;
}

export interface Permissions {
  canCreateCases: boolean;
  canEditCases: boolean;
  canDeleteCases: boolean;
  canCreateReports: boolean;
  canApproveReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageInventory: boolean;
}

export interface Authentication {
  lastLoginAt?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockedUntil?: Date;
  emailVerified: boolean;
  mobileVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface User {
  userId: string; // USR123456 format
  username: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  role: UserRole;
  managedPatients?: Types.ObjectId[]; // For consumer users managing family members
  profile: UserProfile;
  healthProfile?: HealthProfile; // Mainly for B2C users
  employment?: Employment; // Mainly for B2B users
  permissions: Permissions;
  authentication: Authentication;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
}

export interface UserDocument extends User, Document {
  generateUserId(): string;
  getFullName(): string;
  canManagePatient(patientId: Types.ObjectId): boolean;
  hasPermission(permission: keyof Permissions): boolean;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Schemas
const UserProfileSchema = new Schema<UserProfile>({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: Object.values(Gender) },
  mobileNumber: { 
    type: String, 
    match: /^\+?[1-9]\d{1,14}$/,
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
  }
}, { _id: false });

const HealthProfileSchema = new Schema<HealthProfile>({
  height: { type: Number, min: 0, max: 300 },
  weight: { type: Number, min: 0, max: 500 },
  bloodGroup: { type: String, enum: Object.values(BloodGroup) },
  allergies: [{ type: String, maxlength: 100 }],
  medications: [{ type: String, maxlength: 100 }],
  medicalConditions: [{ type: String, maxlength: 100 }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, { _id: false });

const EmploymentSchema = new Schema<Employment>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', sparse: true },
  designation: { type: String, maxlength: 100 },
  department: { type: String, maxlength: 100 },
  joiningDate: Date,
  reportingTo: { type: Schema.Types.ObjectId, ref: 'User', sparse: true }
}, { _id: false });

const PermissionsSchema = new Schema<Permissions>({
  canCreateCases: { type: Boolean, default: false },
  canEditCases: { type: Boolean, default: false },
  canDeleteCases: { type: Boolean, default: false },
  canCreateReports: { type: Boolean, default: false },
  canApproveReports: { type: Boolean, default: false },
  canManageUsers: { type: Boolean, default: false },
  canViewAnalytics: { type: Boolean, default: false },
  canManageInventory: { type: Boolean, default: false }
}, { _id: false });

const AuthenticationSchema = new Schema<Authentication>({
  lastLoginAt: Date,
  lastPasswordChange: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  lockedUntil: Date,
  emailVerified: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false }
}, { _id: false });

const UserSchema = new Schema<UserDocument>({
  userId: { 
    type: String, 
    unique: true, 
    match: /^USR[0-9]{6}$/,
    required: true
  },
  username: { 
    type: String, 
    unique: true, 
    required: true, 
    minlength: 3, 
    maxlength: 50,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  passwordHash: { type: String, required: true, select: false },
  userType: { type: String, enum: Object.values(UserType), required: true },
  role: { type: String, enum: Object.values(UserRole), required: true },
  managedPatients: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Patient',
    validate: {
      validator: function(v: Types.ObjectId[]) {
        return !v || v.length <= 20;
      },
      message: 'Cannot manage more than 20 patients'
    }
  }],
  profile: { type: UserProfileSchema, required: true },
  healthProfile: HealthProfileSchema,
  employment: EmploymentSchema,
  permissions: { type: PermissionsSchema, required: true },
  authentication: { type: AuthenticationSchema, required: true },
  
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
UserSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});

// Methods using bracket notation for TypeScript strict mode
UserSchema.methods['generateUserId'] = function(): string {
  const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `USR${randomNum}`;
};

UserSchema.methods['getFullName'] = function(): string {
  return `${this['profile'].firstName} ${this['profile'].lastName}`;
};

UserSchema.methods['canManagePatient'] = function(patientId: Types.ObjectId): boolean {
  if (this['userType'] === UserType.B2B) {
    return true; // B2B users can manage all patients
  }
  return this['managedPatients']?.some((id: Types.ObjectId) => id.equals(patientId)) || false;
};

UserSchema.methods['hasPermission'] = function(permission: keyof Permissions): boolean {
  return this['permissions'][permission] === true;
};

UserSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['isActive'] = false;
  return this['save']();
};

UserSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['isActive'] = true;
  return this['save']();
};

// Pre-save middleware for userId generation
UserSchema.pre('save', async function() {
  if (this.isNew && !this['userId']) {
    let userId: string;
    let exists: any;
    
    do {
      userId = this['generateUserId']();
      exists = await (this.constructor as any).exists({ userId });
    } while (exists);
    
    this['userId'] = userId;
  }
});

// Indexes
UserSchema.index({ userId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ userType: 1, role: 1 });
UserSchema.index({ 'profile.mobileNumber': 1 }, { sparse: true });
UserSchema.index({ 'employment.organizationId': 1 }, { sparse: true });
UserSchema.index({ 'authentication.emailVerified': 1 });

export const UserModel = model<UserDocument>('User', UserSchema);