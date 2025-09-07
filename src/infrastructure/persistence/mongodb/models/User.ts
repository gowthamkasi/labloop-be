/**
 * User Model for LabLoop Healthcare System
 * Unified user model for B2B (lab staff) and B2C (consumer patients) users
 * Implements comprehensive validation, middleware, and HIPAA-compliant audit logging
 */

import { Schema, model, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { 
  IUser, 
  UserType, 
  UserRole, 
  Gender, 
  BloodGroup,
  IUserProfile,
  IEmployment,
  IHealthProfile,
  IUserPermissions,
  IAuthentication,
  IUserStatus,
  IUserPreferences,
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
      validate: {
        validator: (coords: number[]) => coords.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
      index: '2dsphere',
    },
  },
}, { _id: false });

const userProfileSchema = new Schema<IUserProfile>({
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
    enum: {
      values: ['male', 'female', 'other'] as Gender[],
      message: 'Gender must be male, female, or other',
    },
  },
  mobileNumber: {
    type: String,
    sparse: true,
    unique: true,
    validate: {
      validator: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Please provide a valid mobile number',
    },
  },
  profilePicture: {
    type: String,
    maxlength: [500, 'Profile picture URL cannot exceed 500 characters'],
    validate: {
      validator: (url: string) => {
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Profile picture must be a valid image URL',
    },
  },
  address: addressSchema,
}, { _id: false });

const employmentSchema = new Schema<IEmployment>({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'organizations',
    sparse: true,
  },
  designation: {
    type: String,
    maxlength: [100, 'Designation cannot exceed 100 characters'],
    trim: true,
  },
  department: {
    type: String,
    maxlength: [100, 'Department cannot exceed 100 characters'],
    trim: true,
  },
  joiningDate: {
    type: Date,
    validate: {
      validator: (date: Date) => date <= new Date(),
      message: 'Joining date cannot be in the future',
    },
  },
  reportingTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    sparse: true,
  },
}, { _id: false });

const healthProfileSchema = new Schema<IHealthProfile>({
  height: {
    type: Number,
    min: [0, 'Height must be positive'],
    max: [300, 'Height must be realistic (max 300 cm)'],
  },
  weight: {
    type: Number,
    min: [0, 'Weight must be positive'],
    max: [500, 'Weight must be realistic (max 500 kg)'],
  },
  bloodGroup: {
    type: String,
    enum: {
      values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[],
      message: 'Invalid blood group',
    },
  },
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
  medicalConditions: {
    type: [String],
    validate: {
      validator: (conditions: string[]) => conditions.length <= 20,
      message: 'Cannot have more than 20 medical conditions',
    },
  },
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { 
      type: String,
      validate: {
        validator: (phone: string) => !phone || /^\+?[1-9]\d{1,14}$/.test(phone),
        message: 'Emergency contact phone must be valid',
      },
    },
    relationship: { type: String, trim: true },
    _id: false,
  },
}, { _id: false });

const userPermissionsSchema = new Schema<IUserPermissions>({
  canCreateCases: { type: Boolean, default: false },
  canEditCases: { type: Boolean, default: false },
  canDeleteCases: { type: Boolean, default: false },
  canCreateReports: { type: Boolean, default: false },
  canApproveReports: { type: Boolean, default: false },
  canManageUsers: { type: Boolean, default: false },
  canViewAnalytics: { type: Boolean, default: false },
  canManageInventory: { type: Boolean, default: false },
}, { _id: false });

const authenticationSchema = new Schema<IAuthentication>({
  twoFactorEnabled: { type: Boolean, default: false },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, sparse: true },
  lastLogin: { type: Date },
  refreshToken: { type: String, sparse: true },
}, { _id: false });

const userStatusSchema = new Schema<IUserStatus>({
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
}, { _id: false });

const userPreferencesSchema = new Schema<IUserPreferences>({
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    _id: false,
  },
}, { _id: false });

// ====================== MAIN USER SCHEMA ======================

const userSchema = new Schema<IUser>({
  userId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (userId: string) => /^USR[0-9]{6}$/.test(userId),
      message: 'User ID must follow pattern USR followed by 6 digits',
    },
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    validate: {
      validator: (username: string) => /^[a-zA-Z0-9._-]+$/.test(username),
      message: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
    },
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (email: string) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      },
      message: 'Please provide a valid email address',
    },
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Exclude from queries by default
    validate: {
      validator: function (password: string) {
        // Only validate if password is being set (not for updates without password change)
        if (this.isNew || this.isModified('passwordHash')) {
          return password && password.length >= 8;
        }
        return true;
      },
      message: 'Password must be at least 8 characters long',
    },
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: {
      values: ['b2b', 'b2c'] as UserType[],
      message: 'User type must be either b2b or b2c',
    },
  },
  role: {
    type: String,
    required: [true, 'User role is required'],
    enum: {
      values: [
        'admin', 
        'labManager', 
        'technician', 
        'collectionAgent', 
        'receptionist', 
        'qualityController', 
        'labAssistant', 
        'consumer', 
        'familyManager'
      ] as UserRole[],
      message: 'Invalid user role',
    },
  },
  managedPatients: {
    type: [Schema.Types.ObjectId],
    ref: 'patients',
    validate: {
      validator: (patients: Types.ObjectId[]) => patients.length <= 20,
      message: 'Cannot manage more than 20 patients',
    },
  },
  profile: {
    type: userProfileSchema,
    required: [true, 'User profile is required'],
  },
  employment: employmentSchema,
  healthProfile: healthProfileSchema,
  permissions: {
    type: userPermissionsSchema,
    required: [true, 'User permissions are required'],
  },
  authentication: {
    type: authenticationSchema,
    required: [true, 'Authentication details are required'],
  },
  status: {
    type: userStatusSchema,
    required: [true, 'User status is required'],
  },
  preferences: {
    type: userPreferencesSchema,
    required: [true, 'User preferences are required'],
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
      delete ret.passwordHash;
      delete ret.authentication.refreshToken;
      return ret;
    },
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.authentication.refreshToken;
      return ret;
    },
  },
});

// ====================== INDEXES ======================

// Unique indexes
userSchema.index({ userId: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// Composite indexes for common queries
userSchema.index({ userType: 1, role: 1, 'status.isActive': 1 });
userSchema.index({ 'employment.organizationId': 1, 'status.isActive': 1 });
userSchema.index({ 'profile.mobileNumber': 1 }, { sparse: true });

// Text search index
userSchema.index({
  username: 'text',
  email: 'text',
  'profile.firstName': 'text',
  'profile.lastName': 'text',
});

// Geospatial index
userSchema.index({ 'profile.address.coordinates': '2dsphere' });

// ====================== VIRTUAL PROPERTIES ======================

userSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.virtual('age').get(function () {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual('isLocked').get(function () {
  return this.authentication.lockedUntil && this.authentication.lockedUntil > new Date();
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware for password hashing
userSchema.pre('save', async function (next) {
  // Auto-generate userId if not provided
  if (this.isNew && !this.userId) {
    this.userId = await generateUserId();
  }

  // Hash password if modified
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2b$')) {
    try {
      const saltRounds = 12;
      this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    } catch (error) {
      return next(error as Error);
    }
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  next();
});

// Pre-validate middleware
userSchema.pre('validate', function (next) {
  // Normalize email
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  // Normalize username
  if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }

  // Set default permissions based on role
  if (this.isNew || this.isModified('role')) {
    this.permissions = getDefaultPermissions(this.role);
  }

  next();
});

// Post-save middleware for logging
userSchema.post('save', function (doc, next) {
  console.log(`User ${doc.fullName} (${doc.userId}) has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
userSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.incrementLoginAttempts = function (): Promise<IUser> {
  // Reset login attempts if lock has expired
  if (this.authentication.lockedUntil && this.authentication.lockedUntil < new Date()) {
    return this.updateOne({
      $unset: { 'authentication.lockedUntil': 1 },
      $set: { 'authentication.loginAttempts': 1 },
    });
  }

  const updates: any = { $inc: { 'authentication.loginAttempts': 1 } };

  // Lock account after 5 failed attempts
  if (this.authentication.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      'authentication.lockedUntil': new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function (): Promise<IUser> {
  return this.updateOne({
    $unset: {
      'authentication.loginAttempts': 1,
      'authentication.lockedUntil': 1,
    },
    $set: {
      'authentication.lastLogin': new Date(),
    },
  });
};

userSchema.methods.softDelete = function (deletedBy?: Types.ObjectId): Promise<IUser> {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findActiveUsers = function (filter: any = {}) {
  return this.find({ ...filter, 'status.isActive': true });
};

userSchema.statics.findByRole = function (role: UserRole, organizationId?: string) {
  const query: any = { role };
  if (organizationId) {
    query['employment.organizationId'] = organizationId;
  }
  return this.find(query);
};

// ====================== HELPER FUNCTIONS ======================

async function generateUserId(): Promise<string> {
  const User = model<IUser>('User');
  let userId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    userId = `USR${timestamp}${random}`;
    exists = await User.exists({ userId });
  } while (exists);

  return userId;
}

function getDefaultPermissions(role: UserRole): IUserPermissions {
  const permissions: IUserPermissions = {
    canCreateCases: false,
    canEditCases: false,
    canDeleteCases: false,
    canCreateReports: false,
    canApproveReports: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManageInventory: false,
  };

  switch (role) {
    case 'admin':
      return {
        canCreateCases: true,
        canEditCases: true,
        canDeleteCases: true,
        canCreateReports: true,
        canApproveReports: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageInventory: true,
      };
    case 'labManager':
      return {
        ...permissions,
        canCreateCases: true,
        canEditCases: true,
        canCreateReports: true,
        canApproveReports: true,
        canViewAnalytics: true,
        canManageInventory: true,
      };
    case 'technician':
      return {
        ...permissions,
        canCreateReports: true,
        canViewAnalytics: true,
      };
    case 'qualityController':
      return {
        ...permissions,
        canApproveReports: true,
        canViewAnalytics: true,
      };
    case 'consumer':
    case 'familyManager':
      return {
        ...permissions,
        canCreateCases: true,
      };
    default:
      return permissions;
  }
}

// ====================== MODEL EXPORT ======================

export const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;