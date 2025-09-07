/**
 * TypeScript Interfaces and Types for LabLoop Healthcare System
 * Comprehensive type definitions for all domain models
 */

import { Document, Types } from 'mongoose';

// ====================== ENUMS AND CONSTANTS ======================

export type UserType = 'b2b' | 'b2c';
export type UserRole = 'admin' | 'labManager' | 'technician' | 'collectionAgent' | 'receptionist' | 'qualityController' | 'labAssistant' | 'consumer' | 'familyManager';
export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
export type PatientStatus = 'active' | 'inactive' | 'deceased';
export type ReferralType = 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';

// ====================== BASE INTERFACES ======================

export interface IBaseDocument extends Document {
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  };
}

export interface IAddress {
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

export interface IContact {
  mobileNumber: string;
  alternateNumber?: string;
  email?: string;
  address?: IAddress;
}

// ====================== USER MODEL ======================

export interface IUserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: Gender;
  mobileNumber?: string;
  profilePicture?: string;
  address?: IAddress;
}

export interface IEmployment {
  organizationId?: Types.ObjectId;
  designation?: string;
  department?: string;
  joiningDate?: Date;
  reportingTo?: Types.ObjectId;
}

export interface IHealthProfile {
  height?: number;
  weight?: number;
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

export interface IUserPermissions {
  canCreateCases: boolean;
  canEditCases: boolean;
  canDeleteCases: boolean;
  canCreateReports: boolean;
  canApproveReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageInventory: boolean;
}

export interface IAuthentication {
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lockedUntil?: Date;
  lastLogin?: Date;
  refreshToken?: string;
}

export interface IUserStatus {
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface IUserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface IUser extends IBaseDocument {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  role: UserRole;
  managedPatients?: Types.ObjectId[];
  profile: IUserProfile;
  employment?: IEmployment;
  healthProfile?: IHealthProfile;
  permissions: IUserPermissions;
  authentication: IAuthentication;
  status: IUserStatus;
  preferences: IUserPreferences;
}

// ====================== PATIENT MODEL ======================

export interface IPatientDemographics {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
}

export interface IPatientContact {
  mobileNumber: string;
  alternateNumber?: string;
  email?: string;
  address?: IAddress;
}

export interface IMedicalHistory {
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  surgeries?: string[];
  familyHistory?: Record<string, any>;
}

export interface IInsurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil?: Date;
}

export interface IReferralChain {
  referralId: string;
  referredBy: Types.ObjectId;
  referredByType: ReferralType;
  referredByName: string;
  referredTo?: Types.ObjectId;
  referredToType?: ReferralType;
  referralDate: Date;
  referralReason?: string;
  referralNotes?: string;
  referralTests?: Types.ObjectId[];
  isActive: boolean;
  completedDate?: Date;
}

export interface ICurrentReferralSource {
  referredBy?: Types.ObjectId;
  referredByType?: ReferralType;
  referredByName?: string;
  referralDate?: Date;
}

export interface IPatientConsent {
  dataSharing: boolean;
  researchParticipation: boolean;
  marketingCommunication: boolean;
  familyAccessConsent: boolean;
  consentDate?: Date;
}

export interface IPatientStatistics {
  totalCases: number;
  totalReports: number;
  lastVisit?: Date;
}

export interface IPatient extends IBaseDocument {
  patientId: string;
  mrn?: string;
  primaryUserId?: Types.ObjectId;
  authorizedUsers?: Types.ObjectId[];
  linkedConsumerAccount?: Types.ObjectId;
  demographics: IPatientDemographics;
  contact: IPatientContact;
  medicalHistory?: IMedicalHistory;
  insurance?: IInsurance;
  referralChain?: IReferralChain[];
  currentReferralSource?: ICurrentReferralSource;
  consent: IPatientConsent;
  statistics: IPatientStatistics;
  status: PatientStatus;
}

// ====================== HOSPITAL MODEL ======================

export type HospitalType = 'general' | 'specialty' | 'multiSpecialty' | 'teaching' | 'research';

export interface IAccreditation {
  nabh: boolean;
  nabl: boolean;
  jci: boolean;
  iso: boolean;
}

export interface IHospital extends IBaseDocument {
  hospitalId: string;
  hospitalType: HospitalType;
  accreditation: IAccreditation;
  departments?: string[];
  // Additional hospital fields will be added
}

// ====================== LAB MODEL ======================

export interface ILab extends IBaseDocument {
  labId: string;
  // Lab fields will be added
}

// ====================== TEST MODEL ======================

export interface ITest extends IBaseDocument {
  testId: string;
  // Test fields will be added
}

// ====================== CASE MODEL ======================

export interface ICase extends IBaseDocument {
  caseId: string;
  // Case fields will be added
}

// ====================== SAMPLE MODEL ======================

export interface ISample extends IBaseDocument {
  sampleId: string;
  // Sample fields will be added
}

// ====================== REPORT MODEL ======================

export interface IReport extends IBaseDocument {
  reportId: string;
  // Report fields will be added
}

// ====================== INVOICE MODEL ======================

export interface IInvoice extends IBaseDocument {
  invoiceId: string;
  // Invoice fields will be added
}

// ====================== APPOINTMENT MODEL ======================

export interface IAppointment extends IBaseDocument {
  appointmentId: string;
  // Appointment fields will be added
}

// ====================== AUDIT TRAIL ======================

export interface IAuditTrail extends Document {
  action: 'create' | 'update' | 'delete' | 'read';
  documentId: string | Types.ObjectId;
  collection: string;
  userId?: string | Types.ObjectId;
  timestamp: Date;
  changes?: {
    old?: Record<string, any>;
    new?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

// ====================== PAGINATION AND QUERY INTERFACES ======================

export interface IPaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ISearchQuery {
  searchTerm?: string;
  filters?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  populate?: string[];
}

// ====================== API RESPONSE INTERFACES ======================

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: IPaginatedResult<any>['pagination'];
    timestamp: Date;
    version: string;
  };
}

// ====================== ERROR INTERFACES ======================

export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Record<string, any>;
}

// Export commonly used types for convenience
export type MongoId = string | Types.ObjectId;
export type OptionalId<T> = Omit<T, '_id'> & { _id?: Types.ObjectId };
export type CreateInput<T> = Omit<T, keyof IBaseDocument | '_id'>;
export type UpdateInput<T> = Partial<Omit<T, keyof IBaseDocument | '_id'>>;