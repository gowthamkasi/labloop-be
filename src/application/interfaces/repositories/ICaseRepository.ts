/**
 * Case Repository Interface for LabLoop Healthcare System
 * Handles medical cases with workflow states and sample management
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { ICase } from '../../types/index.js';

export interface ICaseRepository extends IBaseRepository<ICase> {
  // Basic case identification
  findByCaseId(caseId: string): Promise<ICase | null>;
  
  // Patient-related queries
  findByPatientId(patientId: string | Types.ObjectId): Promise<ICase[]>;
  findByMRN(mrn: string): Promise<ICase[]>;
  
  // Workflow and status management
  findByStatus(status: string): Promise<ICase[]>;
  findByPriority(priority: string): Promise<ICase[]>;
  updateCaseStatus(caseId: string | Types.ObjectId, status: string, updatedBy?: string | Types.ObjectId): Promise<boolean>;
  
  // Provider-related queries
  findByLabId(labId: string | Types.ObjectId): Promise<ICase[]>;
  findByHospitalId(hospitalId: string | Types.ObjectId): Promise<ICase[]>;
  findByDoctorId(doctorId: string | Types.ObjectId): Promise<ICase[]>;
  
  // Date-based queries
  findByDateRange(startDate: Date, endDate: Date): Promise<ICase[]>;
  findTodaysCases(): Promise<ICase[]>;
  findPendingCases(): Promise<ICase[]>;
  findOverdueCases(): Promise<ICase[]>;
  
  // Search and filtering
  searchCases(query: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    patientId?: string | Types.ObjectId;
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
    assignedTo?: string | Types.ObjectId;
  }): Promise<ICase[]>;
  
  // Analytics and reporting
  getCaseStats(filter?: {
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    averageProcessingTime: number;
    overdueCases: number;
  }>;
  
  // Batch operations
  bulkUpdateStatus(caseIds: (string | Types.ObjectId)[], status: string, updatedBy?: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  bulkAssignCases(caseIds: (string | Types.ObjectId)[], assignedTo: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
}