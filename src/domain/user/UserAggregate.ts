/**
 * User Aggregate Root - Manages user domain logic and ensures consistency
 */

import { UserEntity, IUserEntity, IUserProfile } from './UserEntity.js';
import { UserRole, UserRolePermissions } from './UserRoles.js';
import { UserPermissionService } from './UserPermissions.js';
import { UserCreatedEvent, UserUpdatedEvent, UserDeactivatedEvent } from './events/index.js';
import { 
  InvalidUserDataError, 
  UserNotFoundError, 
  UnauthorizedAccessError,
  AccountLockedError 
} from './exceptions/index.js';

export interface IUserAggregate {
  user: UserEntity;
  isDirty: boolean;
  version: number;
}

export class UserAggregate implements IUserAggregate {
  public user: UserEntity;
  public isDirty: boolean = false;
  public version: number = 0;
  private events: any[] = [];

  constructor(userData: Partial<IUserEntity>) {
    this.user = new UserEntity(userData);
    this.version = 0;
  }

  // Factory methods
  public static create(userData: {
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    profile: IUserProfile;
    labId?: string;
    labName?: string;
    hospitalId?: string;
    hospitalName?: string;
    createdBy?: string;
  }): UserAggregate {
    // Validate required fields
    if (!userData.username?.trim()) {
      throw new InvalidUserDataError('Username is required');
    }
    if (!userData.email?.trim()) {
      throw new InvalidUserDataError('Email is required');
    }
    if (!userData.passwordHash) {
      throw new InvalidUserDataError('Password hash is required');
    }
    if (!userData.profile?.firstName?.trim()) {
      throw new InvalidUserDataError('First name is required');
    }
    if (!userData.profile?.lastName?.trim()) {
      throw new InvalidUserDataError('Last name is required');
    }

    // Validate email format
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new InvalidUserDataError('Invalid email format');
    }

    // Validate role
    if (!UserRolePermissions.isValidRole(userData.role)) {
      throw new InvalidUserDataError('Invalid user role');
    }

    const aggregate = new UserAggregate({
      ...userData,
      _id: '', // Will be set by repository
      isActive: true,
      isVerified: false,
      failedLoginAttempts: 0,
      hipaaTrainingCompleted: false,
      refreshTokens: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Add domain event
    aggregate.addEvent(new UserCreatedEvent(aggregate.user.toPlainObject()));
    aggregate.markDirty();

    return aggregate;
  }

  public static fromEntity(userData: IUserEntity): UserAggregate {
    const aggregate = new UserAggregate(userData);
    aggregate.version = 1; // Existing entity
    return aggregate;
  }

  // Business methods
  public authenticate(plainPassword: string, passwordService: any): boolean {
    if (!this.user.canLogin()) {
      if (this.user.isAccountLocked()) {
        throw new AccountLockedError('Account is temporarily locked due to multiple failed login attempts');
      }
      throw new UnauthorizedAccessError('Account is not active or verified');
    }

    const isValid = passwordService.comparePasswords(plainPassword, this.user.passwordHash);
    
    if (!isValid) {
      this.user.incrementFailedLogin();
      this.markDirty();
      return false;
    }

    this.user.recordLogin();
    this.markDirty();
    return true;
  }

  public updateProfile(
    profileData: Partial<IUserProfile>,
    updatedBy?: string
  ): void {
    // Validate profile data
    if (profileData.firstName !== undefined && !profileData.firstName?.trim()) {
      throw new InvalidUserDataError('First name cannot be empty');
    }
    if (profileData.lastName !== undefined && !profileData.lastName?.trim()) {
      throw new InvalidUserDataError('Last name cannot be empty');
    }

    const oldProfile = { ...this.user.profile };
    this.user.updateProfile(profileData);
    
    if (updatedBy) {
      this.user.updatedBy = updatedBy;
    }

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { profile: { old: oldProfile, new: this.user.profile } },
      updatedBy
    }));

    this.markDirty();
  }

  public changePassword(
    currentPassword: string,
    newPassword: string,
    passwordService: any
  ): void {
    // Verify current password
    if (!passwordService.comparePasswords(currentPassword, this.user.passwordHash)) {
      throw new UnauthorizedAccessError('Current password is incorrect');
    }

    // Validate new password strength
    if (!passwordService.isStrongPassword(newPassword)) {
      throw new InvalidUserDataError('New password does not meet security requirements');
    }

    const newPasswordHash = passwordService.hashPassword(newPassword);
    this.user.updatePassword(newPasswordHash);

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { password: 'changed' },
      updatedBy: this.user._id
    }));

    this.markDirty();
  }

  public resetPassword(newPasswordHash: string, resetBy?: string): void {
    this.user.updatePassword(newPasswordHash);
    this.user.updatedBy = resetBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { password: 'reset' },
      updatedBy: resetBy
    }));

    this.markDirty();
  }

  public changeRole(
    newRole: UserRole,
    changedBy: string,
    changedByRole: UserRole
  ): void {
    // Check if the person changing the role has permission
    if (!UserPermissionService.canAssignRole(changedByRole, newRole)) {
      throw new UnauthorizedAccessError('Insufficient permissions to assign this role');
    }

    if (!UserRolePermissions.isValidRole(newRole)) {
      throw new InvalidUserDataError('Invalid user role');
    }

    const oldRole = this.user.role;
    this.user.changeRole(newRole);
    this.user.updatedBy = changedBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { role: { old: oldRole, new: newRole } },
      updatedBy: changedBy
    }));

    this.markDirty();
  }

  public assignToLab(
    labId: string,
    labName: string,
    assignedBy: string
  ): void {
    if (!labId?.trim() || !labName?.trim()) {
      throw new InvalidUserDataError('Lab ID and name are required');
    }

    this.user.assignToLab(labId, labName);
    this.user.updatedBy = assignedBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { labAssignment: { labId, labName } },
      updatedBy: assignedBy
    }));

    this.markDirty();
  }

  public assignToHospital(
    hospitalId: string,
    hospitalName: string,
    assignedBy: string
  ): void {
    if (!hospitalId?.trim() || !hospitalName?.trim()) {
      throw new InvalidUserDataError('Hospital ID and name are required');
    }

    this.user.assignToHospital(hospitalId, hospitalName);
    this.user.updatedBy = assignedBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { hospitalAssignment: { hospitalId, hospitalName } },
      updatedBy: assignedBy
    }));

    this.markDirty();
  }

  public activate(activatedBy: string): void {
    if (this.user.isActive) return;

    this.user.activate();
    this.user.updatedBy = activatedBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { status: 'activated' },
      updatedBy: activatedBy
    }));

    this.markDirty();
  }

  public deactivate(deactivatedBy: string, reason?: string): void {
    if (!this.user.isActive) return;

    this.user.deactivate();
    this.user.updatedBy = deactivatedBy;

    this.addEvent(new UserDeactivatedEvent({
      userId: this.user._id,
      reason,
      deactivatedBy
    }));

    this.markDirty();
  }

  public verify(verifiedBy: string): void {
    if (this.user.isVerified) return;

    this.user.verify();
    this.user.updatedBy = verifiedBy;

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { verification: 'verified' },
      updatedBy: verifiedBy
    }));

    this.markDirty();
  }

  public completeHipaaTraining(completedBy?: string): void {
    this.user.completeHipaaTraining();
    if (completedBy) {
      this.user.updatedBy = completedBy;
    }

    this.addEvent(new UserUpdatedEvent({
      userId: this.user._id,
      changes: { hipaaTraining: 'completed' },
      updatedBy: completedBy || this.user._id
    }));

    this.markDirty();
  }

  public addRefreshToken(token: string): void {
    this.user.addRefreshToken(token);
    this.markDirty();
  }

  public removeRefreshToken(token: string): void {
    this.user.removeRefreshToken(token);
    this.markDirty();
  }

  public clearAllRefreshTokens(): void {
    this.user.clearAllRefreshTokens();
    this.markDirty();
  }

  // Permission helpers
  public hasPermission(permission: keyof import('./UserRoles.js').IRolePermissions): boolean {
    return this.user.hasPermission(permission);
  }

  public canAccess(resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
    return this.user.canAccess(resource, action);
  }

  public canAccessLab(labId: string): boolean {
    return UserPermissionService.canAccessLab(this.user.getPermissions(), labId);
  }

  public canAccessHospital(hospitalId: string): boolean {
    return UserPermissionService.canAccessHospital(this.user.getPermissions(), hospitalId);
  }

  // Event management
  public addEvent(event: any): void {
    this.events.push(event);
  }

  public getEvents(): any[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }

  // State management
  public markDirty(): void {
    this.isDirty = true;
    this.version += 1;
  }

  public markClean(): void {
    this.isDirty = false;
  }

  // Validation
  public isValid(): boolean {
    return !!(
      this.user.username?.trim() &&
      this.user.email?.trim() &&
      this.user.passwordHash &&
      this.user.profile?.firstName?.trim() &&
      this.user.profile?.lastName?.trim() &&
      UserRolePermissions.isValidRole(this.user.role)
    );
  }

  public getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.user.username?.trim()) errors.push('Username is required');
    if (!this.user.email?.trim()) errors.push('Email is required');
    if (!this.user.passwordHash) errors.push('Password is required');
    if (!this.user.profile?.firstName?.trim()) errors.push('First name is required');
    if (!this.user.profile?.lastName?.trim()) errors.push('Last name is required');
    if (!UserRolePermissions.isValidRole(this.user.role)) errors.push('Valid role is required');

    return errors;
  }

  // Serialization
  public toPlainObject(): IUserEntity {
    return this.user.toPlainObject();
  }

  public toSafeObject(): Partial<IUserEntity> {
    return this.user.toSafeObject();
  }
}