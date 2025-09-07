/**
 * Database Migration: Create Indexes for LabLoop Healthcare System
 * Ensures all required indexes are created for optimal query performance
 */

import mongoose from 'mongoose';
import { User, Patient } from '../models/index.js';
import { ILogger } from '@/shared/utils/Logger.js';

export interface IMigration {
  version: string;
  description: string;
  up(): Promise<void>;
  down(): Promise<void>;
}

export class CreateIndexesMigration implements IMigration {
  public readonly version = '001';
  public readonly description = 'Create indexes for User and Patient collections';

  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async up(): Promise<void> {
    this.logger.info('Running migration: Create indexes');

    try {
      // Create User collection indexes
      await this.createUserIndexes();
      
      // Create Patient collection indexes
      await this.createPatientIndexes();

      this.logger.info('Migration completed successfully: Create indexes');
    } catch (error) {
      this.logger.error('Migration failed: Create indexes', error as Error);
      throw error;
    }
  }

  async down(): Promise<void> {
    this.logger.info('Rolling back migration: Create indexes');

    try {
      // Drop User collection indexes (except default _id index)
      await this.dropUserIndexes();
      
      // Drop Patient collection indexes (except default _id index)
      await this.dropPatientIndexes();

      this.logger.info('Migration rollback completed: Create indexes');
    } catch (error) {
      this.logger.error('Migration rollback failed: Create indexes', error as Error);
      throw error;
    }
  }

  private async createUserIndexes(): Promise<void> {
    this.logger.info('Creating User collection indexes');

    const userCollection = User.collection;

    // Unique indexes
    await userCollection.createIndex({ userId: 1 }, { unique: true, name: 'idx_users_userId' });
    await userCollection.createIndex({ username: 1 }, { unique: true, name: 'idx_users_username' });
    await userCollection.createIndex({ email: 1 }, { unique: true, name: 'idx_users_email' });

    // Sparse unique index for mobile number
    await userCollection.createIndex(
      { 'profile.mobileNumber': 1 }, 
      { 
        unique: true, 
        sparse: true, 
        name: 'idx_users_mobileNumber' 
      }
    );

    // Composite indexes for common queries
    await userCollection.createIndex(
      { userType: 1, role: 1, 'status.isActive': 1 }, 
      { name: 'idx_users_type_role_active' }
    );

    await userCollection.createIndex(
      { 'employment.organizationId': 1, 'status.isActive': 1 }, 
      { name: 'idx_users_org_active' }
    );

    // Text search index
    await userCollection.createIndex(
      {
        username: 'text',
        email: 'text',
        'profile.firstName': 'text',
        'profile.lastName': 'text',
      },
      { name: 'idx_users_text_search' }
    );

    // Geospatial index
    await userCollection.createIndex(
      { 'profile.address.coordinates': '2dsphere' }, 
      { name: 'idx_users_geospatial' }
    );

    // Health profile indexes
    await userCollection.createIndex(
      { 'healthProfile.bloodGroup': 1 }, 
      { sparse: true, name: 'idx_users_bloodGroup' }
    );

    // Authentication indexes
    await userCollection.createIndex(
      { 'authentication.lastLogin': -1 }, 
      { sparse: true, name: 'idx_users_lastLogin' }
    );

    await userCollection.createIndex(
      { 'authentication.lockedUntil': 1 }, 
      { sparse: true, name: 'idx_users_lockedUntil' }
    );

    // Metadata indexes
    await userCollection.createIndex(
      { 'metadata.createdAt': -1 }, 
      { name: 'idx_users_createdAt' }
    );

    await userCollection.createIndex(
      { 'metadata.deletedAt': 1 }, 
      { sparse: true, name: 'idx_users_deletedAt' }
    );

    this.logger.info('User collection indexes created successfully');
  }

  private async createPatientIndexes(): Promise<void> {
    this.logger.info('Creating Patient collection indexes');

    const patientCollection = Patient.collection;

    // Unique indexes
    await patientCollection.createIndex({ patientId: 1 }, { unique: true, name: 'idx_patients_patientId' });
    await patientCollection.createIndex({ mrn: 1 }, { unique: true, sparse: true, name: 'idx_patients_mrn' });

    // User relationship indexes
    await patientCollection.createIndex(
      { primaryUserId: 1 }, 
      { sparse: true, name: 'idx_patients_primaryUser' }
    );

    await patientCollection.createIndex(
      { authorizedUsers: 1 }, 
      { sparse: true, name: 'idx_patients_authorizedUsers' }
    );

    await patientCollection.createIndex(
      { linkedConsumerAccount: 1 }, 
      { sparse: true, name: 'idx_patients_linkedAccount' }
    );

    // Demographics indexes
    await patientCollection.createIndex(
      { 'demographics.dateOfBirth': 1 }, 
      { name: 'idx_patients_dob' }
    );

    await patientCollection.createIndex(
      { 'demographics.gender': 1 }, 
      { name: 'idx_patients_gender' }
    );

    await patientCollection.createIndex(
      { 'demographics.bloodGroup': 1 }, 
      { sparse: true, name: 'idx_patients_bloodGroup' }
    );

    // Contact indexes
    await patientCollection.createIndex(
      { 'contact.mobileNumber': 1 }, 
      { name: 'idx_patients_mobileNumber' }
    );

    await patientCollection.createIndex(
      { 'contact.email': 1 }, 
      { sparse: true, name: 'idx_patients_email' }
    );

    // Referral tracking indexes
    await patientCollection.createIndex(
      { 'referralChain.referredBy': 1, 'referralChain.isActive': 1 }, 
      { name: 'idx_patients_referral_active' }
    );

    await patientCollection.createIndex(
      { 'currentReferralSource.referredBy': 1 }, 
      { sparse: true, name: 'idx_patients_currentReferral' }
    );

    await patientCollection.createIndex(
      { 'currentReferralSource.referredByType': 1 }, 
      { sparse: true, name: 'idx_patients_referralType' }
    );

    await patientCollection.createIndex(
      { 'referralChain.referralDate': -1 }, 
      { name: 'idx_patients_referralDate' }
    );

    // Status and statistics indexes
    await patientCollection.createIndex(
      { status: 1, 'metadata.createdAt': -1 }, 
      { name: 'idx_patients_status_created' }
    );

    await patientCollection.createIndex(
      { 'statistics.lastVisit': -1 }, 
      { sparse: true, name: 'idx_patients_lastVisit' }
    );

    await patientCollection.createIndex(
      { 'statistics.totalCases': -1 }, 
      { name: 'idx_patients_totalCases' }
    );

    // Medical history indexes
    await patientCollection.createIndex(
      { 'medicalHistory.allergies': 1 }, 
      { sparse: true, name: 'idx_patients_allergies' }
    );

    await patientCollection.createIndex(
      { 'medicalHistory.conditions': 1 }, 
      { sparse: true, name: 'idx_patients_conditions' }
    );

    // Insurance indexes
    await patientCollection.createIndex(
      { 'insurance.provider': 1 }, 
      { sparse: true, name: 'idx_patients_insuranceProvider' }
    );

    await patientCollection.createIndex(
      { 'insurance.validUntil': 1 }, 
      { sparse: true, name: 'idx_patients_insuranceExpiry' }
    );

    // Text search index
    await patientCollection.createIndex(
      {
        'demographics.firstName': 'text',
        'demographics.lastName': 'text',
        patientId: 'text',
        mrn: 'text',
        'contact.email': 'text'
      },
      { name: 'idx_patients_text_search' }
    );

    // Compound indexes for common queries
    await patientCollection.createIndex(
      { 'demographics.gender': 1, 'demographics.bloodGroup': 1 }, 
      { name: 'idx_patients_gender_blood' }
    );

    await patientCollection.createIndex(
      { status: 1, 'demographics.dateOfBirth': 1 }, 
      { name: 'idx_patients_status_age' }
    );

    // Geospatial index for address
    await patientCollection.createIndex(
      { 'contact.address.coordinates': '2dsphere' }, 
      { sparse: true, name: 'idx_patients_geospatial' }
    );

    // Metadata indexes
    await patientCollection.createIndex(
      { 'metadata.createdAt': -1 }, 
      { name: 'idx_patients_createdAt' }
    );

    await patientCollection.createIndex(
      { 'metadata.deletedAt': 1 }, 
      { sparse: true, name: 'idx_patients_deletedAt' }
    );

    this.logger.info('Patient collection indexes created successfully');
  }

  private async dropUserIndexes(): Promise<void> {
    this.logger.info('Dropping User collection indexes');

    const userCollection = User.collection;
    const indexes = await userCollection.listIndexes().toArray();
    
    // Drop all indexes except the default _id index
    for (const index of indexes) {
      if (index.name !== '_id_') {
        await userCollection.dropIndex(index.name);
        this.logger.debug(`Dropped index: ${index.name}`);
      }
    }

    this.logger.info('User collection indexes dropped successfully');
  }

  private async dropPatientIndexes(): Promise<void> {
    this.logger.info('Dropping Patient collection indexes');

    const patientCollection = Patient.collection;
    const indexes = await patientCollection.listIndexes().toArray();
    
    // Drop all indexes except the default _id index
    for (const index of indexes) {
      if (index.name !== '_id_') {
        await patientCollection.dropIndex(index.name);
        this.logger.debug(`Dropped index: ${index.name}`);
      }
    }

    this.logger.info('Patient collection indexes dropped successfully');
  }
}