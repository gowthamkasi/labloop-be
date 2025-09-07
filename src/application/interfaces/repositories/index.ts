/**
 * Repository Interfaces for LabLoop Healthcare System
 * Defines contracts for database operations following repository pattern
 */

import { Document, FilterQuery, UpdateQuery, PopulateOptions, Types } from 'mongoose';

/**
 * Base repository interface with common CRUD operations
 */
export interface IBaseRepository<T extends Document> {
  // Create operations
  create(data: Partial<T>): Promise<T>;
  createMany(data: Partial<T>[]): Promise<T[]>;

  // Read operations
  findById(id: string | Types.ObjectId, populate?: string | PopulateOptions): Promise<T | null>;
  findOne(filter: FilterQuery<T>, populate?: string | PopulateOptions): Promise<T | null>;
  findMany(
    filter: FilterQuery<T>, 
    options?: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | PopulateOptions;
    }
  ): Promise<T[]>;
  findWithPagination(
    filter: FilterQuery<T>,
    options: {
      page: number;
      limit: number;
      sort?: Record<string, 1 | -1>;
      populate?: string | PopulateOptions;
    }
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>;

  // Update operations
  updateById(id: string | Types.ObjectId, update: UpdateQuery<T>): Promise<T | null>;
  updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null>;
  updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<{ modifiedCount: number }>;

  // Delete operations (soft delete by default)
  softDeleteById(id: string | Types.ObjectId, deletedBy?: string | Types.ObjectId): Promise<T | null>;
  softDeleteOne(filter: FilterQuery<T>, deletedBy?: string | Types.ObjectId): Promise<T | null>;
  softDeleteMany(filter: FilterQuery<T>, deletedBy?: string | Types.ObjectId): Promise<{ modifiedCount: number }>;

  // Hard delete operations (use with caution)
  hardDeleteById(id: string | Types.ObjectId): Promise<T | null>;
  hardDeleteOne(filter: FilterQuery<T>): Promise<T | null>;
  hardDeleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }>;

  // Utility operations
  exists(filter: FilterQuery<T>): Promise<boolean>;
  count(filter: FilterQuery<T>): Promise<number>;
  aggregate<R = any>(pipeline: any[]): Promise<R[]>;

  // Health check
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
}

/**
 * Audit trail interface for tracking changes
 */
export interface IAuditTrail {
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

/**
 * Healthcare-specific audit repository
 */
export interface IAuditRepository extends IBaseRepository<Document & IAuditTrail> {
  logAction(audit: Omit<IAuditTrail, 'timestamp'>): Promise<void>;
  getAuditLog(
    documentId: string | Types.ObjectId,
    options?: {
      startDate?: Date;
      endDate?: Date;
      actions?: IAuditTrail['action'][];
    }
  ): Promise<IAuditTrail[]>;
}

// Export all repository interfaces
export * from './IUserRepository.js';
export * from './IPatientRepository.js';
export * from './IHospitalRepository.js';
export * from './ILabRepository.js';
export * from './ITestRepository.js';
export * from './ICaseRepository.js';
export * from './ISampleRepository.js';
export * from './IReportRepository.js';
export * from './IInvoiceRepository.js';
export * from './IAppointmentRepository.js';