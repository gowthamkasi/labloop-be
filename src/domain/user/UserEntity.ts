/**
 * User Entity - Core user domain entity with healthcare-specific business logic
 */

import { UserRole } from './UserRoles.js';
import { IUserPermissions, UserPermissionService } from './UserPermissions.js';

export interface IUserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface IUserEntity {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  profile: IUserProfile;
  labId?: string;
  labName?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Security fields
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  
  // Healthcare compliance
  hipaaTrainingCompleted: boolean;
  hipaaTrainingDate?: Date;
  
  // Session management
  refreshTokens: string[];
  
  // Audit fields
  createdBy?: string;
  updatedBy?: string;
}

export class UserEntity implements IUserEntity {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  profile: IUserProfile;
  labId?: string;
  labName?: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  hipaaTrainingCompleted: boolean;
  hipaaTrainingDate?: Date;
  refreshTokens: string[];
  createdBy?: string;
  updatedBy?: string;

  constructor(data: Partial<IUserEntity>) {
    this._id = data._id || '';
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.role = data.role || UserRole.VIEWER;
    this.isActive = data.isActive ?? true;
    this.isVerified = data.isVerified ?? false;
    this.lastLogin = data.lastLogin;
    this.profile = data.profile || { firstName: '', lastName: '' };
    this.labId = data.labId;
    this.labName = data.labName;
    this.hospitalId = data.hospitalId;
    this.hospitalName = data.hospitalName;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastPasswordChange = data.lastPasswordChange;
    this.failedLoginAttempts = data.failedLoginAttempts || 0;
    this.accountLockedUntil = data.accountLockedUntil;
    this.hipaaTrainingCompleted = data.hipaaTrainingCompleted ?? false;
    this.hipaaTrainingDate = data.hipaaTrainingDate;
    this.refreshTokens = data.refreshTokens || [];
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;
  }

  // Business logic methods

  public getDisplayName(): string {
    if (this.profile.firstName && this.profile.lastName) {
      return `${this.profile.firstName} ${this.profile.lastName}`;
    }
    return this.username || this.email;
  }

  public getFullName(): string {
    return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
  }

  public isAccountLocked(): boolean {
    return this.accountLockedUntil ? this.accountLockedUntil > new Date() : false;
  }

  public canLogin(): boolean {
    return this.isActive && this.isVerified && !this.isAccountLocked();
  }

  public needsPasswordReset(): boolean {
    if (!this.lastPasswordChange) return true;
    
    // Require password reset every 90 days for healthcare compliance
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    return this.lastPasswordChange < ninetyDaysAgo;
  }

  public needsHipaaTraining(): boolean {
    if (!this.hipaaTrainingCompleted) return true;
    if (!this.hipaaTrainingDate) return true;
    
    // Require HIPAA training renewal every year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return this.hipaaTrainingDate < oneYearAgo;
  }

  public incrementFailedLogin(): void {
    this.failedLoginAttempts += 1;
    this.updatedAt = new Date();
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.failedLoginAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      this.accountLockedUntil = lockUntil;
    }
  }

  public resetFailedLogins(): void {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
    this.updatedAt = new Date();
  }

  public recordLogin(): void {
    this.lastLogin = new Date();
    this.resetFailedLogins();
    this.updatedAt = new Date();
  }

  public addRefreshToken(token: string): void {
    // Keep only the last 5 refresh tokens per user
    this.refreshTokens.push(token);
    if (this.refreshTokens.length > 5) {
      this.refreshTokens = this.refreshTokens.slice(-5);
    }
    this.updatedAt = new Date();
  }

  public removeRefreshToken(token: string): void {
    this.refreshTokens = this.refreshTokens.filter(t => t !== token);
    this.updatedAt = new Date();
  }

  public clearAllRefreshTokens(): void {
    this.refreshTokens = [];
    this.updatedAt = new Date();
  }

  public updatePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.lastPasswordChange = new Date();
    this.updatedAt = new Date();
    // Clear all refresh tokens on password change for security
    this.clearAllRefreshTokens();
  }

  public updateProfile(profileData: Partial<IUserProfile>): void {
    this.profile = { ...this.profile, ...profileData };
    this.updatedAt = new Date();
  }

  public assignToLab(labId: string, labName: string): void {
    this.labId = labId;
    this.labName = labName;
    this.updatedAt = new Date();
  }

  public assignToHospital(hospitalId: string, hospitalName: string): void {
    this.hospitalId = hospitalId;
    this.hospitalName = hospitalName;
    this.updatedAt = new Date();
  }

  public completeHipaaTraining(): void {
    this.hipaaTrainingCompleted = true;
    this.hipaaTrainingDate = new Date();
    this.updatedAt = new Date();
  }

  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
    // Clear all refresh tokens on deactivation
    this.clearAllRefreshTokens();
  }

  public verify(): void {
    this.isVerified = true;
    this.updatedAt = new Date();
  }

  public changeRole(newRole: UserRole): void {
    this.role = newRole;
    this.updatedAt = new Date();
    // Clear refresh tokens on role change for security
    this.clearAllRefreshTokens();
  }

  public getPermissions(): IUserPermissions {
    return {
      userId: this._id,
      role: this.role,
      labId: this.labId,
      hospitalId: this.hospitalId,
      isActive: this.isActive
    };
  }

  public hasPermission(permission: keyof import('./UserRoles.js').IRolePermissions): boolean {
    return UserPermissionService.hasPermission(this.getPermissions(), permission);
  }

  public canAccess(resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
    return UserPermissionService.canAccess(this.getPermissions(), resource, action);
  }

  // Convert to plain object for database storage
  public toPlainObject(): IUserEntity {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      role: this.role,
      isActive: this.isActive,
      isVerified: this.isVerified,
      lastLogin: this.lastLogin,
      profile: this.profile,
      labId: this.labId,
      labName: this.labName,
      hospitalId: this.hospitalId,
      hospitalName: this.hospitalName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastPasswordChange: this.lastPasswordChange,
      failedLoginAttempts: this.failedLoginAttempts,
      accountLockedUntil: this.accountLockedUntil,
      hipaaTrainingCompleted: this.hipaaTrainingCompleted,
      hipaaTrainingDate: this.hipaaTrainingDate,
      refreshTokens: this.refreshTokens,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }

  // Convert to safe object for API responses (exclude sensitive data)
  public toSafeObject(): Partial<IUserEntity> {
    const safe = { ...this.toPlainObject() };
    delete safe.passwordHash;
    delete safe.refreshTokens;
    delete safe.failedLoginAttempts;
    delete safe.accountLockedUntil;
    return safe;
  }

  public static fromPlainObject(data: IUserEntity): UserEntity {
    return new UserEntity(data);
  }
}