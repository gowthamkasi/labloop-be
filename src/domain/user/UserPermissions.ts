/**
 * User Permissions Domain Service
 * Handles permission validation and access control logic
 */

import { UserRole, UserRolePermissions, IRolePermissions } from './UserRoles.js';

export interface IUserPermissions {
  userId: string;
  role: UserRole;
  labId?: string;
  hospitalId?: string;
  isActive: boolean;
}

export class UserPermissionService {
  /**
   * Check if user has specific permission
   */
  public static hasPermission(
    user: IUserPermissions,
    permission: keyof IRolePermissions
  ): boolean {
    if (!user.isActive) {
      return false;
    }

    return UserRolePermissions.hasPermission(user.role, permission);
  }

  /**
   * Check if user can access a resource with specific action
   */
  public static canAccess(
    user: IUserPermissions,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean {
    if (!user.isActive) {
      return false;
    }

    return UserRolePermissions.canAccess(user.role, resource, action);
  }

  /**
   * Check if user can access specific lab data
   */
  public static canAccessLab(
    user: IUserPermissions,
    targetLabId: string
  ): boolean {
    if (!user.isActive) {
      return false;
    }

    // Admin can access all labs
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Other users can only access their assigned lab
    return user.labId === targetLabId;
  }

  /**
   * Check if user can access specific hospital data
   */
  public static canAccessHospital(
    user: IUserPermissions,
    targetHospitalId: string
  ): boolean {
    if (!user.isActive) {
      return false;
    }

    // Admin can access all hospitals
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Other users can only access their assigned hospital
    return user.hospitalId === targetHospitalId;
  }

  /**
   * Get user's effective permissions
   */
  public static getEffectivePermissions(
    user: IUserPermissions
  ): IRolePermissions {
    if (!user.isActive) {
      // Return no permissions for inactive users
      return {
        canCreateUsers: false,
        canUpdateUsers: false,
        canDeleteUsers: false,
        canViewUsers: false,
        canCreatePatients: false,
        canUpdatePatients: false,
        canDeletePatients: false,
        canViewPatients: false,
        canCreateCases: false,
        canUpdateCases: false,
        canDeleteCases: false,
        canViewCases: false,
        canCollectSamples: false,
        canUpdateSamples: false,
        canDeleteSamples: false,
        canViewSamples: false,
        canCreateTests: false,
        canUpdateTests: false,
        canDeleteTests: false,
        canViewTests: false,
        canGenerateReports: false,
        canApproveReports: false,
        canFinalizeReports: false,
        canViewReports: false,
        canCreateInvoices: false,
        canUpdateInvoices: false,
        canDeleteInvoices: false,
        canViewInvoices: false,
        canManageLabs: false,
        canViewLabs: false,
        canManageHospitals: false,
        canViewHospitals: false,
        canAccessAdminPanel: false,
        canViewSystemLogs: false,
        canManageSystemSettings: false,
      };
    }

    return UserRolePermissions.getPermissions(user.role);
  }

  /**
   * Validate role assignment
   */
  public static canAssignRole(
    assignerRole: UserRole,
    targetRole: UserRole
  ): boolean {
    // Only admin can assign roles
    if (assignerRole !== UserRole.ADMIN) {
      return false;
    }

    // Admin can assign any role
    return true;
  }

  /**
   * Get accessible resources for a user
   */
  public static getAccessibleResources(
    user: IUserPermissions
  ): string[] {
    if (!user.isActive) {
      return [];
    }

    const permissions = this.getEffectivePermissions(user);
    const resources: string[] = [];

    if (permissions.canViewUsers) resources.push('users');
    if (permissions.canViewPatients) resources.push('patients');
    if (permissions.canViewCases) resources.push('cases');
    if (permissions.canViewSamples) resources.push('samples');
    if (permissions.canViewTests) resources.push('tests');
    if (permissions.canViewReports) resources.push('reports');
    if (permissions.canViewInvoices) resources.push('invoices');
    if (permissions.canViewLabs) resources.push('labs');
    if (permissions.canViewHospitals) resources.push('hospitals');

    return resources;
  }

  /**
   * Check if user can perform bulk operations
   */
  public static canPerformBulkOperations(
    user: IUserPermissions,
    resource: string
  ): boolean {
    if (!user.isActive) {
      return false;
    }

    // Only admin and lab_admin can perform bulk operations
    const allowedRoles = [UserRole.ADMIN, UserRole.LAB_ADMIN];
    
    return allowedRoles.includes(user.role) && 
           this.canAccess(user, resource, 'update');
  }

  /**
   * Get role hierarchy level (for permission inheritance)
   */
  public static getRoleLevel(role: UserRole): number {
    const roleLevels: Record<UserRole, number> = {
      [UserRole.ADMIN]: 1,
      [UserRole.LAB_ADMIN]: 2,
      [UserRole.LAB_TECHNICIAN]: 3,
      [UserRole.COLLECTOR]: 4,
      [UserRole.VIEWER]: 5,
    };

    return roleLevels[role];
  }

  /**
   * Check if one role has higher privileges than another
   */
  public static hasHigherPrivileges(
    role1: UserRole,
    role2: UserRole
  ): boolean {
    return this.getRoleLevel(role1) < this.getRoleLevel(role2);
  }

  /**
   * Get filtered permissions for API responses (remove sensitive info)
   */
  public static getPublicPermissions(
    user: IUserPermissions
  ): Partial<IRolePermissions> {
    const permissions = this.getEffectivePermissions(user);

    // Remove sensitive system-level permissions from public API
    const publicPermissions = { ...permissions };
    delete (publicPermissions as any).canAccessAdminPanel;
    delete (publicPermissions as any).canViewSystemLogs;
    delete (publicPermissions as any).canManageSystemSettings;

    return publicPermissions;
  }
}