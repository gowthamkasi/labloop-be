import { Gender, BloodGroup } from '../types/enums.js';
import { Address } from './User.interface.js';

export interface PatientProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
  mobileNumber?: string;
  email?: string;
  profilePicture?: string;
  address?: Address;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface MedicalHistory {
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  surgicalHistory?: string[];
  familyHistory?: string[];
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'never' | 'occasional' | 'regular';
}

export interface InsuranceInfo {
  providerName?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil?: Date;
}

export interface ReferralInfo {
  referredBy?: string;
  referredByType?: 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';
  referredByName?: string;
  referralDate?: Date;
  referralReason?: string;
  referralNotes?: string;
  referralTests?: string[];
}

export interface Patient {
  _id: string;
  patientId: string; // PAT123456 format
  profile: PatientProfile;
  medicalHistory: MedicalHistory;
  insuranceInfo?: InsuranceInfo;
  currentReferralSource?: ReferralInfo;
  registeredBy?: string;
  registeredByType?: 'hospital' | 'lab' | 'clinic' | 'consumer';
  
  // Statistics
  totalCases: number;
  totalReports: number;
  lastVisit?: Date;
  
  // Consent flags
  dataSharing: boolean;
  researchParticipation: boolean;
  marketingCommunication: boolean;
  familyAccessConsent: boolean;
  consentDate?: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
}