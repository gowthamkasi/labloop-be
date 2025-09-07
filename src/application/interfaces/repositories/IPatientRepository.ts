/**
 * Patient Repository Interface for LabLoop Healthcare System
 * Handles patient records with enhanced user relationships and referral tracking
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IPatient, ReferralType, PatientStatus } from '../../types/index.js';

export interface IReferralChain {
  referralId: string;
  referredBy: Types.ObjectId;
  referredByType: 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';
  referredByName: string;
  referredTo?: Types.ObjectId;
  referredToType?: 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';
  referralDate: Date;
  referralReason?: string;
  referralNotes?: string;
  referralTests?: Types.ObjectId[];
  isActive: boolean;
  completedDate?: Date;
}

export interface IPatientRepository extends IBaseRepository<IPatient> {
  // Basic patient identification
  findByPatientId(patientId: string): Promise<IPatient | null>;
  findByMRN(mrn: string): Promise<IPatient | null>;
  findByMobileNumber(mobileNumber: string): Promise<IPatient | null>;
  
  // User relationship management
  findByPrimaryUser(userId: string | Types.ObjectId): Promise<IPatient[]>;
  findByAuthorizedUser(userId: string | Types.ObjectId): Promise<IPatient[]>;
  findByLinkedConsumerAccount(userId: string | Types.ObjectId): Promise<IPatient | null>;
  
  // Authorization management
  addAuthorizedUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>;
  removeAuthorizedUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>;
  updatePrimaryUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>;
  linkConsumerAccount(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>;
  
  // Referral chain management
  addReferral(patientId: string | Types.ObjectId, referral: Omit<IReferralChain, 'referralId' | 'isActive'>): Promise<boolean>;
  updateReferral(patientId: string | Types.ObjectId, referralId: string, update: Partial<IReferralChain>): Promise<boolean>;
  completeReferral(patientId: string | Types.ObjectId, referralId: string, completedDate?: Date): Promise<boolean>;
  deactivateReferral(patientId: string | Types.ObjectId, referralId: string): Promise<boolean>;
  
  // Referral queries
  findByReferralSource(referredBy: string | Types.ObjectId, referredByType: ReferralType): Promise<IPatient[]>;
  findActiveReferrals(referredBy: string | Types.ObjectId): Promise<IPatient[]>;
  findPendingReferrals(referredTo: string | Types.ObjectId): Promise<IPatient[]>;
  getReferralHistory(patientId: string | Types.ObjectId): Promise<IReferralChain[]>;
  
  // Medical history management
  updateMedicalHistory(patientId: string | Types.ObjectId, medicalHistory: Partial<IPatient['medicalHistory']>): Promise<boolean>;
  addAllergy(patientId: string | Types.ObjectId, allergy: string): Promise<boolean>;
  removeAllergy(patientId: string | Types.ObjectId, allergy: string): Promise<boolean>;
  addMedication(patientId: string | Types.ObjectId, medication: string): Promise<boolean>;
  removeMedication(patientId: string | Types.ObjectId, medication: string): Promise<boolean>;
  addCondition(patientId: string | Types.ObjectId, condition: string): Promise<boolean>;
  removeCondition(patientId: string | Types.ObjectId, condition: string): Promise<boolean>;
  
  // Demographics and contact management
  updateDemographics(patientId: string | Types.ObjectId, demographics: Partial<IPatient['demographics']>): Promise<boolean>;
  updateContact(patientId: string | Types.ObjectId, contact: Partial<IPatient['contact']>): Promise<boolean>;
  updateInsurance(patientId: string | Types.ObjectId, insurance: Partial<IPatient['insurance']>): Promise<boolean>;
  
  // Consent management
  updateConsent(patientId: string | Types.ObjectId, consent: Partial<IPatient['consent']>): Promise<boolean>;
  getConsentStatus(patientId: string | Types.ObjectId): Promise<IPatient['consent']>;
  
  // Status management
  updateStatus(patientId: string | Types.ObjectId, status: PatientStatus): Promise<boolean>;
  markAsDeceased(patientId: string | Types.ObjectId): Promise<boolean>;
  reactivatePatient(patientId: string | Types.ObjectId): Promise<boolean>;
  
  // Statistics management
  updateStatistics(patientId: string | Types.ObjectId, stats: Partial<IPatient['statistics']>): Promise<boolean>;
  incrementCaseCount(patientId: string | Types.ObjectId): Promise<boolean>;
  incrementReportCount(patientId: string | Types.ObjectId): Promise<boolean>;
  updateLastVisit(patientId: string | Types.ObjectId, date?: Date): Promise<boolean>;
  
  // Search and filtering
  searchPatients(query: {
    searchTerm?: string;
    bloodGroup?: string;
    gender?: string;
    status?: PatientStatus;
    ageRange?: { min?: number; max?: number };
    city?: string;
    state?: string;
    hasInsurance?: boolean;
    referredBy?: string | Types.ObjectId;
    referredByType?: ReferralType;
    createdDateRange?: { start?: Date; end?: Date };
  }): Promise<IPatient[]>;
  
  // Age-based queries
  findByAgeRange(minAge: number, maxAge: number): Promise<IPatient[]>;
  findPediatricPatients(): Promise<IPatient[]>;
  findGeriatricPatients(): Promise<IPatient[]>;
  
  // Medical condition queries
  findByBloodGroup(bloodGroup: string): Promise<IPatient[]>;
  findByAllergy(allergy: string): Promise<IPatient[]>;
  findByMedication(medication: string): Promise<IPatient[]>;
  findByCondition(condition: string): Promise<IPatient[]>;
  
  // Analytics and reporting
  getPatientStats(filter?: {
    referredBy?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    deceased: number;
    byGender: Record<string, number>;
    byBloodGroup: Record<string, number>;
    byAgeGroup: Record<string, number>;
    withInsurance: number;
    averageAge: number;
  }>;
  
  // Referral analytics
  getReferralStats(referredBy?: string | Types.ObjectId): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    referralsByType: Record<ReferralType, number>;
    averageCompletionTime: number;
  }>;
  
  // Bulk operations
  bulkUpdateStatus(patientIds: (string | Types.ObjectId)[], status: PatientStatus): Promise<{ modifiedCount: number }>;
  bulkUpdateConsent(patientIds: (string | Types.ObjectId)[], consent: Partial<IPatient['consent']>): Promise<{ modifiedCount: number }>;
  
  // GDPR compliance
  anonymizePatient(patientId: string | Types.ObjectId): Promise<boolean>;
  exportPatientData(patientId: string | Types.ObjectId): Promise<IPatient | null>;
  
  // Advanced queries
  findPatientsWithExpiredInsurance(): Promise<IPatient[]>;
  findPatientsWithoutRecentVisits(daysSinceLastVisit: number): Promise<IPatient[]>;
  findDuplicatePatients(): Promise<{ mobileNumber: string; patients: IPatient[] }[]>;
}