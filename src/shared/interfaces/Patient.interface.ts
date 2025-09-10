import { Gender, BloodGroup } from '../types/enums.js';

export interface PatientContactAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PatientContact {
  mobileNumber: string;
  alternateNumber?: string;
  email?: string;
  address?: PatientContactAddress;
}

export interface PatientMedicalHistory {
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  surgeries?: string[];
  familyHistory?: Record<string, string>;
}

export interface PatientInsurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil?: Date;
}

export interface PatientReferralChainItem {
  referralId?: string;
  referredBy: string; // ObjectId as string
  referredByType: 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';
  referredByName: string;
  referredTo?: string; // ObjectId as string
  referredToType?: 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';
  referralDate: Date;
  referralReason?: string;
  referralNotes?: string;
  referralTests?: string[]; // ObjectId array as strings
  isActive?: boolean;
  completedDate?: Date;
}

export interface PatientCurrentReferralSource {
  referredBy?: string; // ObjectId as string
  referredByType?: string;
  referredByName?: string;
  referralDate?: Date;
}

export interface PatientConsent {
  dataSharing: boolean;
  researchParticipation: boolean;
  marketingCommunication: boolean;
  familyAccessConsent: boolean;
  consentDate?: Date;
}

export interface PatientStatistics {
  totalCases: number;
  totalReports: number;
  lastVisit?: Date;
}

export interface Patient {
  _id: string;
  patientId: string; // PAT000001 format
  mrn?: string; // Medical Record Number
  primaryUserId?: string; // Primary consumer user who manages this patient
  authorizedUsers?: string[]; // Additional users authorized to access records
  linkedConsumerAccount?: string; // If patient has their own consumer account
  
  // Demographics fields
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup | 'Unknown';
  
  contact: PatientContact;
  medicalHistory?: PatientMedicalHistory;
  insurance?: PatientInsurance;
  referralChain?: PatientReferralChainItem[];
  currentReferralSource?: PatientCurrentReferralSource;
  consent?: PatientConsent;
  statistics?: PatientStatistics;
  status: 'active' | 'inactive' | 'deceased';

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}
