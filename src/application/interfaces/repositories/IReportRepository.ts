/**
 * Report Repository Interface for LabLoop Healthcare System
 * Handles medical reports with approval workflow and test results
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IReport } from '../../types/index.js';

export interface IReportRepository extends IBaseRepository<IReport> {
  // Basic report identification
  findByReportId(reportId: string): Promise<IReport | null>;
  
  // Case and patient-related queries
  findByCaseId(caseId: string | Types.ObjectId): Promise<IReport[]>;
  findByPatientId(patientId: string | Types.ObjectId): Promise<IReport[]>;
  findByMRN(mrn: string): Promise<IReport[]>;
  
  // Workflow and approval management
  findByStatus(status: string): Promise<IReport[]>;
  findPendingApproval(): Promise<IReport[]>;
  findApprovedReports(): Promise<IReport[]>;
  findDraftReports(): Promise<IReport[]>;
  
  // Approval workflow
  submitForApproval(reportId: string | Types.ObjectId, submittedBy: string | Types.ObjectId): Promise<boolean>;
  approveReport(reportId: string | Types.ObjectId, approvedBy: string | Types.ObjectId, notes?: string): Promise<boolean>;
  rejectReport(reportId: string | Types.ObjectId, rejectedBy: string | Types.ObjectId, reason: string): Promise<boolean>;
  requestRevision(reportId: string | Types.ObjectId, requestedBy: string | Types.ObjectId, comments: string): Promise<boolean>;
  
  // Provider-related queries
  findByLabId(labId: string | Types.ObjectId): Promise<IReport[]>;
  findByDoctorId(doctorId: string | Types.ObjectId): Promise<IReport[]>;
  findByTechnician(technicianId: string | Types.ObjectId): Promise<IReport[]>;
  
  // Date-based queries
  findByReportDate(date: Date): Promise<IReport[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IReport[]>;
  findOverdueReports(): Promise<IReport[]>;
  
  // Test results management
  updateTestResults(reportId: string | Types.ObjectId, testResults: any[]): Promise<boolean>;
  addTestResult(reportId: string | Types.ObjectId, testResult: any): Promise<boolean>;
  
  // Report generation and delivery
  markAsDelivered(reportId: string | Types.ObjectId, deliveredAt: Date, deliveredBy?: string | Types.ObjectId): Promise<boolean>;
  findUndeliveredReports(): Promise<IReport[]>;
  
  // Search and filtering
  searchReports(query: {
    searchTerm?: string;
    status?: string;
    patientId?: string | Types.ObjectId;
    caseId?: string | Types.ObjectId;
    labId?: string | Types.ObjectId;
    doctorId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
    testType?: string;
    isUrgent?: boolean;
  }): Promise<IReport[]>;
  
  // Analytics and reporting
  getReportStats(filter?: {
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageProcessingTime: number;
    averageApprovalTime: number;
    overdueCount: number;
    deliveryRate: number;
    rejectionRate: number;
  }>;
  
  // Quality metrics
  getQualityMetrics(labId?: string | Types.ObjectId): Promise<{
    totalReports: number;
    approvalRate: number;
    averageApprovalTime: number;
    revisionRate: number;
    onTimeDeliveryRate: number;
  }>;
  
  // Batch operations
  bulkUpdateStatus(reportIds: (string | Types.ObjectId)[], status: string, updatedBy?: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  bulkAssignReviewer(reportIds: (string | Types.ObjectId)[], reviewerId: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  
  // Advanced queries
  findCriticalResults(): Promise<IReport[]>;
  findAbnormalResults(): Promise<IReport[]>;
  findReportsByTestValue(testName: string, operator: '>' | '<' | '=' | '>=', value: number): Promise<IReport[]>;
}