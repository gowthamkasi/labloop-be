/**
 * Sample Repository Interface for LabLoop Healthcare System
 * Handles laboratory samples with chain of custody tracking
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { ISample } from '../../types/index.js';

export interface ISampleRepository extends IBaseRepository<ISample> {
  // Basic sample identification
  findBySampleId(sampleId: string): Promise<ISample | null>;
  findByBarcode(barcode: string): Promise<ISample | null>;
  
  // Case and patient-related queries
  findByCaseId(caseId: string | Types.ObjectId): Promise<ISample[]>;
  findByPatientId(patientId: string | Types.ObjectId): Promise<ISample[]>;
  
  // Status and workflow management
  findByStatus(status: string): Promise<ISample[]>;
  updateSampleStatus(sampleId: string | Types.ObjectId, status: string, updatedBy?: string | Types.ObjectId): Promise<boolean>;
  
  // Chain of custody tracking
  addChainOfCustodyEntry(sampleId: string | Types.ObjectId, entry: {
    handedBy: string | Types.ObjectId;
    receivedBy: string | Types.ObjectId;
    timestamp: Date;
    location: string;
    condition: string;
    notes?: string;
  }): Promise<boolean>;
  
  getChainOfCustody(sampleId: string | Types.ObjectId): Promise<any[]>;
  
  // Location and facility tracking
  findByCurrentLocation(location: string): Promise<ISample[]>;
  findByCollectionCenter(collectionCenterId: string | Types.ObjectId): Promise<ISample[]>;
  findByProcessingLab(labId: string | Types.ObjectId): Promise<ISample[]>;
  
  // Quality control
  findSamplesRequiringQC(): Promise<ISample[]>;
  findRejectedSamples(): Promise<ISample[]>;
  findSamplesWithIssues(): Promise<ISample[]>;
  
  // Time-based queries
  findByCollectionDate(date: Date): Promise<ISample[]>;
  findExpiringSamples(days: number): Promise<ISample[]>;
  findOverdueSamples(): Promise<ISample[]>;
  
  // Search and filtering
  searchSamples(query: {
    searchTerm?: string;
    status?: string;
    sampleType?: string;
    collectionDate?: Date;
    patientId?: string | Types.ObjectId;
    caseId?: string | Types.ObjectId;
    labId?: string | Types.ObjectId;
  }): Promise<ISample[]>;
  
  // Analytics and reporting
  getSampleStats(filter?: {
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    averageProcessingTime: number;
    rejectionRate: number;
    expiringCount: number;
  }>;
  
  // Batch operations
  bulkUpdateLocation(sampleIds: (string | Types.ObjectId)[], location: string, updatedBy?: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  bulkUpdateStatus(sampleIds: (string | Types.ObjectId)[], status: string, updatedBy?: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
}