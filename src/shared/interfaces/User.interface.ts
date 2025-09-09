import { UserType, UserRole, Gender, BloodGroup } from '../types/enums.js';

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
  organizationId?: string;
  designation?: string;
  department?: string;
  joiningDate?: Date;
  reportingTo?: string;
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
  _id: string;
  userId: string; // USR123456 format
  username: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  role: UserRole;
  managedPatients?: string[]; // For consumer users managing family members
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