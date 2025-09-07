/**
 * User Repository Interface for LabLoop Healthcare System
 * Handles B2B (lab staff) and B2C (consumer patients) users
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IUser, UserRole, UserType } from '../../types/index.js';

export interface IUserRepository extends IBaseRepository<IUser> {
  // Authentication specific methods
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findByMobileNumber(mobileNumber: string): Promise<IUser | null>;
  findByUserId(userId: string): Promise<IUser | null>;
  
  // Password and authentication methods
  updatePassword(userId: string | Types.ObjectId, passwordHash: string): Promise<boolean>;
  updateRefreshToken(userId: string | Types.ObjectId, refreshToken: string | null): Promise<boolean>;
  incrementLoginAttempts(userId: string | Types.ObjectId): Promise<void>;
  resetLoginAttempts(userId: string | Types.ObjectId): Promise<void>;
  lockAccount(userId: string | Types.ObjectId, lockUntil: Date): Promise<void>;
  updateLastLogin(userId: string | Types.ObjectId): Promise<void>;

  // Role and permission management
  findByRole(role: UserRole, organizationId?: string | Types.ObjectId): Promise<IUser[]>;
  findByUserType(userType: UserType): Promise<IUser[]>;
  updatePermissions(userId: string | Types.ObjectId, permissions: Partial<IUser['permissions']>): Promise<boolean>;
  getUsersWithPermission(permission: keyof IUser['permissions'], value: boolean): Promise<IUser[]>;

  // Organization and employment
  findByOrganization(organizationId: string | Types.ObjectId): Promise<IUser[]>;
  findReportingUsers(managerId: string | Types.ObjectId): Promise<IUser[]>;
  updateEmployment(userId: string | Types.ObjectId, employment: Partial<IUser['employment']>): Promise<boolean>;

  // Consumer user management
  findManagedPatients(userId: string | Types.ObjectId): Promise<IUser[]>;
  addManagedPatient(userId: string | Types.ObjectId, patientId: string | Types.ObjectId): Promise<boolean>;
  removeManagedPatient(userId: string | Types.ObjectId, patientId: string | Types.ObjectId): Promise<boolean>;

  // Health profile management
  updateHealthProfile(userId: string | Types.ObjectId, healthProfile: Partial<IUser['healthProfile']>): Promise<boolean>;
  findByBloodGroup(bloodGroup: string): Promise<IUser[]>;

  // Status management
  activateUser(userId: string | Types.ObjectId): Promise<boolean>;
  deactivateUser(userId: string | Types.ObjectId): Promise<boolean>;
  verifyEmail(userId: string | Types.ObjectId): Promise<boolean>;
  verifyPhone(userId: string | Types.ObjectId): Promise<boolean>;

  // Search and filtering
  searchUsers(query: {
    searchTerm?: string;
    role?: UserRole;
    userType?: UserType;
    organizationId?: string | Types.ObjectId;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<IUser[]>;

  // Analytics and reporting
  getUserStats(organizationId?: string | Types.ObjectId): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    byRole: Record<UserRole, number>;
    byUserType: Record<UserType, number>;
  }>;

  // Geospatial queries
  findNearby(coordinates: [number, number], maxDistance: number): Promise<IUser[]>;

  // Bulk operations
  bulkUpdateStatus(userIds: (string | Types.ObjectId)[], isActive: boolean): Promise<{ modifiedCount: number }>;
  bulkAssignRole(userIds: (string | Types.ObjectId)[], role: UserRole): Promise<{ modifiedCount: number }>;

  // Advanced queries
  findUsersWithExpiredPasswords(daysOld: number): Promise<IUser[]>;
  findLockedAccounts(): Promise<IUser[]>;
  findUsersWithoutLogin(daysAgo: number): Promise<IUser[]>;
}