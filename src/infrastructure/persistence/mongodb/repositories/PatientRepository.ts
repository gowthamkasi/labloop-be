/**
 * Patient Repository Implementation for LabLoop Healthcare System
 * Handles patient records with comprehensive referral tracking and HIPAA compliance
 */

import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { IPatientRepository, IReferralChain } from '@/application/interfaces/repositories/IPatientRepository.js';
import { 
  IPatient, 
  PatientStatus, 
  ReferralType,
  IPatientConsent,
  IMedicalHistory,
  IPatientDemographics,
  IPatientContact,
  IInsurance
} from '@/application/types/index.js';
import { Patient } from '../models/Patient.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';

export class PatientRepository extends BaseRepository<IPatient> implements IPatientRepository {
  constructor(logger: ILogger) {
    super(Patient, logger);
  }

  // ====================== BASIC PATIENT IDENTIFICATION ======================

  async findByPatientId(patientId: string): Promise<IPatient | null> {
    try {
      this.logger.debug('Finding patient by patientId', { patientId });
      return await Patient.findOne({ 
        patientId,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patient by patientId', error as Error);
      throw new DatabaseError('Failed to find patient by patientId', {
        originalError: error,
        patientId,
      });
    }
  }

  async findByMRN(mrn: string): Promise<IPatient | null> {
    try {
      this.logger.debug('Finding patient by MRN', { mrn });
      return await Patient.findOne({ 
        mrn,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patient by MRN', error as Error);
      throw new DatabaseError('Failed to find patient by MRN', {
        originalError: error,
        mrn,
      });
    }
  }

  async findByMobileNumber(mobileNumber: string): Promise<IPatient | null> {
    try {
      this.logger.debug('Finding patient by mobile number', { mobileNumber });
      return await Patient.findOne({ 
        'contact.mobileNumber': mobileNumber,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patient by mobile number', error as Error);
      throw new DatabaseError('Failed to find patient by mobile number', {
        originalError: error,
        mobileNumber,
      });
    }
  }

  // ====================== USER RELATIONSHIP MANAGEMENT ======================

  async findByPrimaryUser(userId: string | Types.ObjectId): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by primary user', { userId });
      return await Patient.find({ 
        primaryUserId: userId,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by primary user', error as Error);
      throw new DatabaseError('Failed to find patients by primary user', {
        originalError: error,
        userId,
      });
    }
  }

  async findByAuthorizedUser(userId: string | Types.ObjectId): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by authorized user', { userId });
      return await Patient.find({ 
        authorizedUsers: userId,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by authorized user', error as Error);
      throw new DatabaseError('Failed to find patients by authorized user', {
        originalError: error,
        userId,
      });
    }
  }

  async findByLinkedConsumerAccount(userId: string | Types.ObjectId): Promise<IPatient | null> {
    try {
      this.logger.debug('Finding patient by linked consumer account', { userId });
      return await Patient.findOne({ 
        linkedConsumerAccount: userId,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patient by linked consumer account', error as Error);
      throw new DatabaseError('Failed to find patient by linked consumer account', {
        originalError: error,
        userId,
      });
    }
  }

  // ====================== AUTHORIZATION MANAGEMENT ======================

  async addAuthorizedUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Adding authorized user to patient', { patientId, userId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          authorizedUsers: { $ne: userId },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { authorizedUsers: userId },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add authorized user', error as Error);
      throw new DatabaseError('Failed to add authorized user', {
        originalError: error,
        patientId,
        userId,
      });
    }
  }

  async removeAuthorizedUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Removing authorized user from patient', { patientId, userId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $pull: { authorizedUsers: userId },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to remove authorized user', error as Error);
      throw new DatabaseError('Failed to remove authorized user', {
        originalError: error,
        patientId,
        userId,
      });
    }
  }

  async updatePrimaryUser(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Updating primary user for patient', { patientId, userId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          primaryUserId: userId,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update primary user', error as Error);
      throw new DatabaseError('Failed to update primary user', {
        originalError: error,
        patientId,
        userId,
      });
    }
  }

  async linkConsumerAccount(patientId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Linking consumer account to patient', { patientId, userId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          linkedConsumerAccount: userId,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to link consumer account', error as Error);
      throw new DatabaseError('Failed to link consumer account', {
        originalError: error,
        patientId,
        userId,
      });
    }
  }

  // ====================== REFERRAL CHAIN MANAGEMENT ======================

  async addReferral(patientId: string | Types.ObjectId, referral: Omit<IReferralChain, 'referralId' | 'isActive'>): Promise<boolean> {
    try {
      this.logger.debug('Adding referral to patient', { patientId });
      
      // Generate referral ID
      const referralId = this.generateReferralId();
      const newReferral: IReferralChain = {
        ...referral,
        referralId,
        isActive: true,
      };

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { referralChain: newReferral },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add referral', error as Error);
      throw new DatabaseError('Failed to add referral', {
        originalError: error,
        patientId,
      });
    }
  }

  async updateReferral(patientId: string | Types.ObjectId, referralId: string, update: Partial<IReferralChain>): Promise<boolean> {
    try {
      this.logger.debug('Updating referral', { patientId, referralId });
      
      const updateFields: any = {};
      Object.keys(update).forEach(key => {
        if (key !== 'referralId') {
          updateFields[`referralChain.$.${key}`] = update[key as keyof IReferralChain];
        }
      });
      updateFields['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'referralChain.referralId': referralId,
          'metadata.deletedAt': { $exists: false }
        },
        updateFields
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update referral', error as Error);
      throw new DatabaseError('Failed to update referral', {
        originalError: error,
        patientId,
        referralId,
      });
    }
  }

  async completeReferral(patientId: string | Types.ObjectId, referralId: string, completedDate?: Date): Promise<boolean> {
    try {
      this.logger.debug('Completing referral', { patientId, referralId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'referralChain.referralId': referralId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'referralChain.$.isActive': false,
          'referralChain.$.completedDate': completedDate || new Date(),
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to complete referral', error as Error);
      throw new DatabaseError('Failed to complete referral', {
        originalError: error,
        patientId,
        referralId,
      });
    }
  }

  async deactivateReferral(patientId: string | Types.ObjectId, referralId: string): Promise<boolean> {
    try {
      this.logger.debug('Deactivating referral', { patientId, referralId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'referralChain.referralId': referralId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'referralChain.$.isActive': false,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to deactivate referral', error as Error);
      throw new DatabaseError('Failed to deactivate referral', {
        originalError: error,
        patientId,
        referralId,
      });
    }
  }

  // ====================== REFERRAL QUERIES ======================

  async findByReferralSource(referredBy: string | Types.ObjectId, referredByType: ReferralType): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by referral source', { referredBy, referredByType });
      return await Patient.find({ 
        'currentReferralSource.referredBy': referredBy,
        'currentReferralSource.referredByType': referredByType,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by referral source', error as Error);
      throw new DatabaseError('Failed to find patients by referral source', {
        originalError: error,
        referredBy,
        referredByType,
      });
    }
  }

  async findActiveReferrals(referredBy: string | Types.ObjectId): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding active referrals', { referredBy });
      return await Patient.find({ 
        'referralChain.referredBy': referredBy,
        'referralChain.isActive': true,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find active referrals', error as Error);
      throw new DatabaseError('Failed to find active referrals', {
        originalError: error,
        referredBy,
      });
    }
  }

  async findPendingReferrals(referredTo: string | Types.ObjectId): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding pending referrals', { referredTo });
      return await Patient.find({ 
        'referralChain.referredTo': referredTo,
        'referralChain.isActive': true,
        'referralChain.completedDate': { $exists: false },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find pending referrals', error as Error);
      throw new DatabaseError('Failed to find pending referrals', {
        originalError: error,
        referredTo,
      });
    }
  }

  async getReferralHistory(patientId: string | Types.ObjectId): Promise<IReferralChain[]> {
    try {
      this.logger.debug('Getting referral history', { patientId });
      const patient = await Patient.findById(patientId, 'referralChain');
      return patient?.referralChain || [];
    } catch (error) {
      this.logger.error('Failed to get referral history', error as Error);
      throw new DatabaseError('Failed to get referral history', {
        originalError: error,
        patientId,
      });
    }
  }

  // ====================== MEDICAL HISTORY MANAGEMENT ======================

  async updateMedicalHistory(patientId: string | Types.ObjectId, medicalHistory: Partial<IMedicalHistory>): Promise<boolean> {
    try {
      this.logger.debug('Updating medical history', { patientId });
      const updateData: any = {};
      
      Object.keys(medicalHistory).forEach(key => {
        updateData[`medicalHistory.${key}`] = medicalHistory[key as keyof IMedicalHistory];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update medical history', error as Error);
      throw new DatabaseError('Failed to update medical history', {
        originalError: error,
        patientId,
      });
    }
  }

  async addAllergy(patientId: string | Types.ObjectId, allergy: string): Promise<boolean> {
    try {
      this.logger.debug('Adding allergy', { patientId, allergy });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'medicalHistory.allergies': { $ne: allergy },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { 'medicalHistory.allergies': allergy },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add allergy', error as Error);
      throw new DatabaseError('Failed to add allergy', {
        originalError: error,
        patientId,
        allergy,
      });
    }
  }

  async removeAllergy(patientId: string | Types.ObjectId, allergy: string): Promise<boolean> {
    try {
      this.logger.debug('Removing allergy', { patientId, allergy });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $pull: { 'medicalHistory.allergies': allergy },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to remove allergy', error as Error);
      throw new DatabaseError('Failed to remove allergy', {
        originalError: error,
        patientId,
        allergy,
      });
    }
  }

  async addMedication(patientId: string | Types.ObjectId, medication: string): Promise<boolean> {
    try {
      this.logger.debug('Adding medication', { patientId, medication });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'medicalHistory.medications': { $ne: medication },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { 'medicalHistory.medications': medication },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add medication', error as Error);
      throw new DatabaseError('Failed to add medication', {
        originalError: error,
        patientId,
        medication,
      });
    }
  }

  async removeMedication(patientId: string | Types.ObjectId, medication: string): Promise<boolean> {
    try {
      this.logger.debug('Removing medication', { patientId, medication });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $pull: { 'medicalHistory.medications': medication },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to remove medication', error as Error);
      throw new DatabaseError('Failed to remove medication', {
        originalError: error,
        patientId,
        medication,
      });
    }
  }

  async addCondition(patientId: string | Types.ObjectId, condition: string): Promise<boolean> {
    try {
      this.logger.debug('Adding condition', { patientId, condition });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'medicalHistory.conditions': { $ne: condition },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { 'medicalHistory.conditions': condition },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add condition', error as Error);
      throw new DatabaseError('Failed to add condition', {
        originalError: error,
        patientId,
        condition,
      });
    }
  }

  async removeCondition(patientId: string | Types.ObjectId, condition: string): Promise<boolean> {
    try {
      this.logger.debug('Removing condition', { patientId, condition });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $pull: { 'medicalHistory.conditions': condition },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to remove condition', error as Error);
      throw new DatabaseError('Failed to remove condition', {
        originalError: error,
        patientId,
        condition,
      });
    }
  }

  // ====================== DEMOGRAPHICS AND CONTACT MANAGEMENT ======================

  async updateDemographics(patientId: string | Types.ObjectId, demographics: Partial<IPatientDemographics>): Promise<boolean> {
    try {
      this.logger.debug('Updating demographics', { patientId });
      const updateData: any = {};
      
      Object.keys(demographics).forEach(key => {
        updateData[`demographics.${key}`] = demographics[key as keyof IPatientDemographics];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update demographics', error as Error);
      throw new DatabaseError('Failed to update demographics', {
        originalError: error,
        patientId,
      });
    }
  }

  async updateContact(patientId: string | Types.ObjectId, contact: Partial<IPatientContact>): Promise<boolean> {
    try {
      this.logger.debug('Updating contact', { patientId });
      const updateData: any = {};
      
      Object.keys(contact).forEach(key => {
        updateData[`contact.${key}`] = contact[key as keyof IPatientContact];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update contact', error as Error);
      throw new DatabaseError('Failed to update contact', {
        originalError: error,
        patientId,
      });
    }
  }

  async updateInsurance(patientId: string | Types.ObjectId, insurance: Partial<IInsurance>): Promise<boolean> {
    try {
      this.logger.debug('Updating insurance', { patientId });
      const updateData: any = {};
      
      Object.keys(insurance).forEach(key => {
        updateData[`insurance.${key}`] = insurance[key as keyof IInsurance];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update insurance', error as Error);
      throw new DatabaseError('Failed to update insurance', {
        originalError: error,
        patientId,
      });
    }
  }

  // ====================== CONSENT MANAGEMENT ======================

  async updateConsent(patientId: string | Types.ObjectId, consent: Partial<IPatientConsent>): Promise<boolean> {
    try {
      this.logger.debug('Updating consent', { patientId });
      const updateData: any = {};
      
      Object.keys(consent).forEach(key => {
        updateData[`consent.${key}`] = consent[key as keyof IPatientConsent];
      });
      updateData['consent.consentDate'] = new Date();
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update consent', error as Error);
      throw new DatabaseError('Failed to update consent', {
        originalError: error,
        patientId,
      });
    }
  }

  async getConsentStatus(patientId: string | Types.ObjectId): Promise<IPatientConsent> {
    try {
      this.logger.debug('Getting consent status', { patientId });
      const patient = await Patient.findById(patientId, 'consent');
      if (!patient) {
        throw new DatabaseError('Patient not found', { patientId });
      }
      return patient.consent;
    } catch (error) {
      this.logger.error('Failed to get consent status', error as Error);
      throw new DatabaseError('Failed to get consent status', {
        originalError: error,
        patientId,
      });
    }
  }

  // ====================== STATUS MANAGEMENT ======================

  async updateStatus(patientId: string | Types.ObjectId, status: PatientStatus): Promise<boolean> {
    try {
      this.logger.debug('Updating patient status', { patientId, status });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          status,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update patient status', error as Error);
      throw new DatabaseError('Failed to update patient status', {
        originalError: error,
        patientId,
        status,
      });
    }
  }

  async markAsDeceased(patientId: string | Types.ObjectId): Promise<boolean> {
    return this.updateStatus(patientId, 'deceased');
  }

  async reactivatePatient(patientId: string | Types.ObjectId): Promise<boolean> {
    return this.updateStatus(patientId, 'active');
  }

  // ====================== STATISTICS MANAGEMENT ======================

  async updateStatistics(patientId: string | Types.ObjectId, stats: Partial<IPatient['statistics']>): Promise<boolean> {
    try {
      this.logger.debug('Updating patient statistics', { patientId });
      const updateData: any = {};
      
      Object.keys(stats).forEach(key => {
        updateData[`statistics.${key}`] = stats[key as keyof IPatient['statistics']];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update patient statistics', error as Error);
      throw new DatabaseError('Failed to update patient statistics', {
        originalError: error,
        patientId,
      });
    }
  }

  async incrementCaseCount(patientId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Incrementing case count', { patientId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $inc: { 'statistics.totalCases': 1 },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to increment case count', error as Error);
      throw new DatabaseError('Failed to increment case count', {
        originalError: error,
        patientId,
      });
    }
  }

  async incrementReportCount(patientId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Incrementing report count', { patientId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $inc: { 'statistics.totalReports': 1 },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to increment report count', error as Error);
      throw new DatabaseError('Failed to increment report count', {
        originalError: error,
        patientId,
      });
    }
  }

  async updateLastVisit(patientId: string | Types.ObjectId, date?: Date): Promise<boolean> {
    try {
      this.logger.debug('Updating last visit', { patientId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'statistics.lastVisit': date || new Date(),
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update last visit', error as Error);
      throw new DatabaseError('Failed to update last visit', {
        originalError: error,
        patientId,
      });
    }
  }

  // ====================== SEARCH AND FILTERING ======================

  async searchPatients(query: {
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
  }): Promise<IPatient[]> {
    try {
      this.logger.debug('Searching patients', { query });
      
      const mongoQuery: any = {
        'metadata.deletedAt': { $exists: false }
      };

      if (query.searchTerm) {
        mongoQuery.$text = { $search: query.searchTerm };
      }

      if (query.bloodGroup) {
        mongoQuery['demographics.bloodGroup'] = query.bloodGroup;
      }

      if (query.gender) {
        mongoQuery['demographics.gender'] = query.gender;
      }

      if (query.status) {
        mongoQuery.status = query.status;
      }

      if (query.ageRange) {
        const today = new Date();
        if (query.ageRange.max) {
          const minDate = new Date(today.getFullYear() - query.ageRange.max - 1, today.getMonth(), today.getDate());
          mongoQuery['demographics.dateOfBirth'] = { $gte: minDate };
        }
        if (query.ageRange.min) {
          const maxDate = new Date(today.getFullYear() - query.ageRange.min, today.getMonth(), today.getDate());
          mongoQuery['demographics.dateOfBirth'] = {
            ...mongoQuery['demographics.dateOfBirth'],
            $lte: maxDate
          };
        }
      }

      if (query.city) {
        mongoQuery['contact.address.city'] = { $regex: query.city, $options: 'i' };
      }

      if (query.state) {
        mongoQuery['contact.address.state'] = { $regex: query.state, $options: 'i' };
      }

      if (query.hasInsurance !== undefined) {
        if (query.hasInsurance) {
          mongoQuery['insurance.provider'] = { $exists: true, $ne: '' };
        } else {
          mongoQuery.$or = [
            { 'insurance.provider': { $exists: false } },
            { 'insurance.provider': '' }
          ];
        }
      }

      if (query.referredBy) {
        mongoQuery['currentReferralSource.referredBy'] = query.referredBy;
      }

      if (query.referredByType) {
        mongoQuery['currentReferralSource.referredByType'] = query.referredByType;
      }

      if (query.createdDateRange) {
        mongoQuery['metadata.createdAt'] = {};
        if (query.createdDateRange.start) {
          mongoQuery['metadata.createdAt'].$gte = query.createdDateRange.start;
        }
        if (query.createdDateRange.end) {
          mongoQuery['metadata.createdAt'].$lte = query.createdDateRange.end;
        }
      }

      return await Patient.find(mongoQuery);
    } catch (error) {
      this.logger.error('Failed to search patients', error as Error);
      throw new DatabaseError('Failed to search patients', {
        originalError: error,
        query,
      });
    }
  }

  // ====================== AGE-BASED QUERIES ======================

  async findByAgeRange(minAge: number, maxAge: number): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by age range', { minAge, maxAge });
      const today = new Date();
      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
      
      return await Patient.find({
        'demographics.dateOfBirth': {
          $gte: minDate,
          $lte: maxDate
        },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by age range', error as Error);
      throw new DatabaseError('Failed to find patients by age range', {
        originalError: error,
        minAge,
        maxAge,
      });
    }
  }

  async findPediatricPatients(): Promise<IPatient[]> {
    return this.findByAgeRange(0, 17);
  }

  async findGeriatricPatients(): Promise<IPatient[]> {
    return this.findByAgeRange(65, 120);
  }

  // ====================== MEDICAL CONDITION QUERIES ======================

  async findByBloodGroup(bloodGroup: string): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by blood group', { bloodGroup });
      return await Patient.find({ 
        'demographics.bloodGroup': bloodGroup,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by blood group', error as Error);
      throw new DatabaseError('Failed to find patients by blood group', {
        originalError: error,
        bloodGroup,
      });
    }
  }

  async findByAllergy(allergy: string): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by allergy', { allergy });
      return await Patient.find({ 
        'medicalHistory.allergies': allergy,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by allergy', error as Error);
      throw new DatabaseError('Failed to find patients by allergy', {
        originalError: error,
        allergy,
      });
    }
  }

  async findByMedication(medication: string): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by medication', { medication });
      return await Patient.find({ 
        'medicalHistory.medications': medication,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by medication', error as Error);
      throw new DatabaseError('Failed to find patients by medication', {
        originalError: error,
        medication,
      });
    }
  }

  async findByCondition(condition: string): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients by condition', { condition });
      return await Patient.find({ 
        'medicalHistory.conditions': condition,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients by condition', error as Error);
      throw new DatabaseError('Failed to find patients by condition', {
        originalError: error,
        condition,
      });
    }
  }

  // ====================== ANALYTICS AND REPORTING ======================

  async getPatientStats(filter?: {
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
  }> {
    try {
      this.logger.debug('Getting patient statistics', { filter });
      
      const matchStage: any = {
        'metadata.deletedAt': { $exists: false }
      };

      if (filter?.referredBy) {
        matchStage['currentReferralSource.referredBy'] = new Types.ObjectId(filter.referredBy as string);
      }

      if (filter?.dateRange) {
        matchStage['metadata.createdAt'] = {
          $gte: filter.dateRange.start,
          $lte: filter.dateRange.end
        };
      }

      const stats = await Patient.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$demographics.dateOfBirth'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            },
            ageGroup: {
              $switch: {
                branches: [
                  { case: { $lt: [{ $floor: { $divide: [{ $subtract: [new Date(), '$demographics.dateOfBirth'] }, 365.25 * 24 * 60 * 60 * 1000] } }, 18] }, then: 'pediatric' },
                  { case: { $lt: [{ $floor: { $divide: [{ $subtract: [new Date(), '$demographics.dateOfBirth'] }, 365.25 * 24 * 60 * 60 * 1000] } }, 65] }, then: 'adult' },
                ],
                default: 'geriatric'
              }
            },
            hasInsurance: {
              $and: [
                { $ne: ['$insurance.provider', null] },
                { $ne: ['$insurance.provider', ''] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            deceased: { $sum: { $cond: [{ $eq: ['$status', 'deceased'] }, 1, 0] } },
            genders: { $push: '$demographics.gender' },
            bloodGroups: { $push: '$demographics.bloodGroup' },
            ageGroups: { $push: '$ageGroup' },
            withInsurance: { $sum: { $cond: ['$hasInsurance', 1, 0] } },
            totalAge: { $sum: '$age' },
            ageCount: { $sum: { $cond: [{ $ne: ['$age', null] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        deceased: 0,
        genders: [],
        bloodGroups: [],
        ageGroups: [],
        withInsurance: 0,
        totalAge: 0,
        ageCount: 0
      };

      // Count by gender
      const byGender: Record<string, number> = {};
      result.genders.forEach((gender: string) => {
        if (gender) byGender[gender] = (byGender[gender] || 0) + 1;
      });

      // Count by blood group
      const byBloodGroup: Record<string, number> = {};
      result.bloodGroups.forEach((group: string) => {
        if (group) byBloodGroup[group] = (byBloodGroup[group] || 0) + 1;
      });

      // Count by age group
      const byAgeGroup: Record<string, number> = {};
      result.ageGroups.forEach((group: string) => {
        byAgeGroup[group] = (byAgeGroup[group] || 0) + 1;
      });

      return {
        total: result.total,
        active: result.active,
        inactive: result.inactive,
        deceased: result.deceased,
        byGender,
        byBloodGroup,
        byAgeGroup,
        withInsurance: result.withInsurance,
        averageAge: result.ageCount > 0 ? Math.round(result.totalAge / result.ageCount) : 0
      };
    } catch (error) {
      this.logger.error('Failed to get patient statistics', error as Error);
      throw new DatabaseError('Failed to get patient statistics', {
        originalError: error,
        filter,
      });
    }
  }

  // ====================== REFERRAL ANALYTICS ======================

  async getReferralStats(referredBy?: string | Types.ObjectId): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    referralsByType: Record<ReferralType, number>;
    averageCompletionTime: number;
  }> {
    try {
      this.logger.debug('Getting referral statistics', { referredBy });
      
      const matchStage: any = {};

      if (referredBy) {
        matchStage['referralChain.referredBy'] = new Types.ObjectId(referredBy as string);
      }

      const stats = await Patient.aggregate([
        { $unwind: '$referralChain' },
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReferrals: { $sum: 1 },
            activeReferrals: { $sum: { $cond: ['$referralChain.isActive', 1, 0] } },
            completedReferrals: { $sum: { $cond: [{ $ne: ['$referralChain.completedDate', null] }, 1, 0] } },
            referralTypes: { $push: '$referralChain.referredByType' },
            completionTimes: {
              $push: {
                $cond: [
                  { $ne: ['$referralChain.completedDate', null] },
                  {
                    $divide: [
                      { $subtract: ['$referralChain.completedDate', '$referralChain.referralDate'] },
                      24 * 60 * 60 * 1000 // Convert to days
                    ]
                  },
                  null
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        referralTypes: [],
        completionTimes: []
      };

      // Count by referral type
      const referralsByType: Record<string, number> = {};
      result.referralTypes.forEach((type: string) => {
        referralsByType[type] = (referralsByType[type] || 0) + 1;
      });

      // Calculate average completion time
      const validCompletionTimes = result.completionTimes.filter((time: number) => time !== null);
      const averageCompletionTime = validCompletionTimes.length > 0 
        ? validCompletionTimes.reduce((sum: number, time: number) => sum + time, 0) / validCompletionTimes.length
        : 0;

      return {
        totalReferrals: result.totalReferrals,
        activeReferrals: result.activeReferrals,
        completedReferrals: result.completedReferrals,
        referralsByType: referralsByType as Record<ReferralType, number>,
        averageCompletionTime: Math.round(averageCompletionTime)
      };
    } catch (error) {
      this.logger.error('Failed to get referral statistics', error as Error);
      throw new DatabaseError('Failed to get referral statistics', {
        originalError: error,
        referredBy,
      });
    }
  }

  // ====================== BULK OPERATIONS ======================

  async bulkUpdateStatus(patientIds: (string | Types.ObjectId)[], status: PatientStatus): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug('Bulk updating patient status', { patientIds: patientIds.length, status });
      const result = await Patient.updateMany(
        { 
          _id: { $in: patientIds },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          status,
          'metadata.updatedAt': new Date()
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error('Failed to bulk update patient status', error as Error);
      throw new DatabaseError('Failed to bulk update patient status', {
        originalError: error,
        patientIds: patientIds.length,
        status,
      });
    }
  }

  async bulkUpdateConsent(patientIds: (string | Types.ObjectId)[], consent: Partial<IPatientConsent>): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug('Bulk updating patient consent', { patientIds: patientIds.length });
      const updateData: any = {};
      
      Object.keys(consent).forEach(key => {
        updateData[`consent.${key}`] = consent[key as keyof IPatientConsent];
      });
      updateData['consent.consentDate'] = new Date();
      updateData['metadata.updatedAt'] = new Date();

      const result = await Patient.updateMany(
        { 
          _id: { $in: patientIds },
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error('Failed to bulk update patient consent', error as Error);
      throw new DatabaseError('Failed to bulk update patient consent', {
        originalError: error,
        patientIds: patientIds.length,
      });
    }
  }

  // ====================== GDPR COMPLIANCE ======================

  async anonymizePatient(patientId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Anonymizing patient data', { patientId });
      const result = await Patient.updateOne(
        { 
          _id: patientId,
          'metadata.deletedAt': { $exists: false }
        },
        {
          'demographics.firstName': 'ANONYMIZED',
          'demographics.lastName': 'PATIENT',
          'contact.email': null,
          'contact.mobileNumber': 'XXXXXXXXXX',
          'contact.alternateNumber': null,
          'contact.address': {},
          'medicalHistory': {},
          'insurance': {},
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to anonymize patient', error as Error);
      throw new DatabaseError('Failed to anonymize patient', {
        originalError: error,
        patientId,
      });
    }
  }

  async exportPatientData(patientId: string | Types.ObjectId): Promise<IPatient | null> {
    try {
      this.logger.debug('Exporting patient data', { patientId });
      return await Patient.findById(patientId);
    } catch (error) {
      this.logger.error('Failed to export patient data', error as Error);
      throw new DatabaseError('Failed to export patient data', {
        originalError: error,
        patientId,
      });
    }
  }

  // ====================== ADVANCED QUERIES ======================

  async findPatientsWithExpiredInsurance(): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients with expired insurance');
      return await Patient.find({
        'insurance.validUntil': { $lt: new Date() },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients with expired insurance', error as Error);
      throw new DatabaseError('Failed to find patients with expired insurance', {
        originalError: error,
      });
    }
  }

  async findPatientsWithoutRecentVisits(daysSinceLastVisit: number): Promise<IPatient[]> {
    try {
      this.logger.debug('Finding patients without recent visits', { daysSinceLastVisit });
      const cutoffDate = new Date(Date.now() - (daysSinceLastVisit * 24 * 60 * 60 * 1000));
      return await Patient.find({
        $or: [
          { 'statistics.lastVisit': { $lt: cutoffDate } },
          { 'statistics.lastVisit': { $exists: false } }
        ],
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find patients without recent visits', error as Error);
      throw new DatabaseError('Failed to find patients without recent visits', {
        originalError: error,
        daysSinceLastVisit,
      });
    }
  }

  async findDuplicatePatients(): Promise<{ mobileNumber: string; patients: IPatient[] }[]> {
    try {
      this.logger.debug('Finding duplicate patients');
      const duplicates = await Patient.aggregate([
        { $match: { 'metadata.deletedAt': { $exists: false } } },
        { 
          $group: { 
            _id: '$contact.mobileNumber', 
            count: { $sum: 1 }, 
            patients: { $push: '$$ROOT' } 
          } 
        },
        { $match: { count: { $gt: 1 } } }
      ]);

      return duplicates.map(duplicate => ({
        mobileNumber: duplicate._id,
        patients: duplicate.patients
      }));
    } catch (error) {
      this.logger.error('Failed to find duplicate patients', error as Error);
      throw new DatabaseError('Failed to find duplicate patients', {
        originalError: error,
      });
    }
  }

  // ====================== HELPER METHODS ======================

  private generateReferralId(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `REF${timestamp}${random}`;
  }
}