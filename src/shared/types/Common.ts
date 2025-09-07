/**
 * Common shared types for the LabLoop Healthcare System
 */

export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export interface IPaginationParams {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrev: boolean;
  };
}

export interface IBaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isDeleted: boolean;
  readonly version: number;
}

export interface IAuditableEntity extends IBaseEntity {
  readonly createdBy: string;
  readonly updatedBy: string;
}

export type EntityId = string;
export type UserId = string;
export type PatientId = string;
export type CaseId = string;
export type SampleId = string;
export type TestId = string;
export type HospitalId = string;
export type LabId = string;
export type DoctorId = string;