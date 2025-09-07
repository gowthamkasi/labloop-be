/**
 * User Roles Domain Logic
 * Defines role-based access control system for healthcare lab management
 */

export enum UserRole {
  // Admin roles
  ADMIN = 'admin',
  LAB_ADMIN = 'lab_admin',

  // Lab staff roles  
  LAB_TECHNICIAN = 'lab_technician',
  COLLECTOR = 'collector',
  
  // Limited access roles
  VIEWER = 'viewer'
}

export interface IRolePermissions {
  // User management
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canViewUsers: boolean;

  // Patient management
  canCreatePatients: boolean;
  canUpdatePatients: boolean;
  canDeletePatients: boolean;
  canViewPatients: boolean;

  // Case management
  canCreateCases: boolean;
  canUpdateCases: boolean;
  canDeleteCases: boolean;
  canViewCases: boolean;

  // Sample management
  canCollectSamples: boolean;
  canUpdateSamples: boolean;
  canDeleteSamples: boolean;
  canViewSamples: boolean;

  // Test management
  canCreateTests: boolean;
  canUpdateTests: boolean;
  canDeleteTests: boolean;
  canViewTests: boolean;

  // Report management
  canGenerateReports: boolean;
  canApproveReports: boolean;
  canFinalizeReports: boolean;
  canViewReports: boolean;

  // Invoice management
  canCreateInvoices: boolean;
  canUpdateInvoices: boolean;
  canDeleteInvoices: boolean;
  canViewInvoices: boolean;

  // Lab management
  canManageLabs: boolean;
  canViewLabs: boolean;

  // Hospital management
  canManageHospitals: boolean;
  canViewHospitals: boolean;

  // System administration
  canAccessAdminPanel: boolean;
  canViewSystemLogs: boolean;
  canManageSystemSettings: boolean;
}

export class UserRolePermissions {
  private static readonly rolePermissions: Record<UserRole, IRolePermissions> = {
    [UserRole.ADMIN]: {
      // Full system access
      canCreateUsers: true,
      canUpdateUsers: true,
      canDeleteUsers: true,
      canViewUsers: true,
      canCreatePatients: true,
      canUpdatePatients: true,
      canDeletePatients: true,
      canViewPatients: true,
      canCreateCases: true,
      canUpdateCases: true,
      canDeleteCases: true,
      canViewCases: true,
      canCollectSamples: true,
      canUpdateSamples: true,
      canDeleteSamples: true,
      canViewSamples: true,
      canCreateTests: true,
      canUpdateTests: true,
      canDeleteTests: true,
      canViewTests: true,
      canGenerateReports: true,
      canApproveReports: true,
      canFinalizeReports: true,
      canViewReports: true,
      canCreateInvoices: true,
      canUpdateInvoices: true,
      canDeleteInvoices: true,
      canViewInvoices: true,
      canManageLabs: true,
      canViewLabs: true,
      canManageHospitals: true,
      canViewHospitals: true,
      canAccessAdminPanel: true,
      canViewSystemLogs: true,
      canManageSystemSettings: true,
    },

    [UserRole.LAB_ADMIN]: {
      // Lab-specific administrative access
      canCreateUsers: false,
      canUpdateUsers: false,
      canDeleteUsers: false,
      canViewUsers: true,
      canCreatePatients: true,
      canUpdatePatients: true,
      canDeletePatients: false,
      canViewPatients: true,
      canCreateCases: true,
      canUpdateCases: true,
      canDeleteCases: false,
      canViewCases: true,
      canCollectSamples: true,
      canUpdateSamples: true,
      canDeleteSamples: false,
      canViewSamples: true,
      canCreateTests: true,
      canUpdateTests: true,
      canDeleteTests: false,
      canViewTests: true,
      canGenerateReports: true,
      canApproveReports: true,
      canFinalizeReports: true,
      canViewReports: true,
      canCreateInvoices: true,
      canUpdateInvoices: true,
      canDeleteInvoices: false,
      canViewInvoices: true,
      canManageLabs: false,
      canViewLabs: true,
      canManageHospitals: false,
      canViewHospitals: true,
      canAccessAdminPanel: false,
      canViewSystemLogs: false,
      canManageSystemSettings: false,
    },

    [UserRole.LAB_TECHNICIAN]: {
      // Lab technician operations
      canCreateUsers: false,
      canUpdateUsers: false,
      canDeleteUsers: false,
      canViewUsers: false,
      canCreatePatients: true,
      canUpdatePatients: true,
      canDeletePatients: false,
      canViewPatients: true,
      canCreateCases: true,
      canUpdateCases: true,
      canDeleteCases: false,
      canViewCases: true,
      canCollectSamples: true,
      canUpdateSamples: true,
      canDeleteSamples: false,
      canViewSamples: true,
      canCreateTests: false,
      canUpdateTests: false,
      canDeleteTests: false,
      canViewTests: true,
      canGenerateReports: true,
      canApproveReports: false,
      canFinalizeReports: false,
      canViewReports: true,
      canCreateInvoices: false,
      canUpdateInvoices: false,
      canDeleteInvoices: false,
      canViewInvoices: true,
      canManageLabs: false,
      canViewLabs: true,
      canManageHospitals: false,
      canViewHospitals: true,
      canAccessAdminPanel: false,
      canViewSystemLogs: false,
      canManageSystemSettings: false,
    },

    [UserRole.COLLECTOR]: {
      // Sample collection focused role
      canCreateUsers: false,
      canUpdateUsers: false,
      canDeleteUsers: false,
      canViewUsers: false,
      canCreatePatients: true,
      canUpdatePatients: false,
      canDeletePatients: false,
      canViewPatients: true,
      canCreateCases: false,
      canUpdateCases: false,
      canDeleteCases: false,
      canViewCases: true,
      canCollectSamples: true,
      canUpdateSamples: true,
      canDeleteSamples: false,
      canViewSamples: true,
      canCreateTests: false,
      canUpdateTests: false,
      canDeleteTests: false,
      canViewTests: true,
      canGenerateReports: false,
      canApproveReports: false,
      canFinalizeReports: false,
      canViewReports: false,
      canCreateInvoices: false,
      canUpdateInvoices: false,
      canDeleteInvoices: false,
      canViewInvoices: false,
      canManageLabs: false,
      canViewLabs: true,
      canManageHospitals: false,
      canViewHospitals: true,
      canAccessAdminPanel: false,
      canViewSystemLogs: false,
      canManageSystemSettings: false,
    },

    [UserRole.VIEWER]: {
      // Read-only access
      canCreateUsers: false,
      canUpdateUsers: false,
      canDeleteUsers: false,
      canViewUsers: false,
      canCreatePatients: false,
      canUpdatePatients: false,
      canDeletePatients: false,
      canViewPatients: true,
      canCreateCases: false,
      canUpdateCases: false,
      canDeleteCases: false,
      canViewCases: true,
      canCollectSamples: false,
      canUpdateSamples: false,
      canDeleteSamples: false,
      canViewSamples: true,
      canCreateTests: false,
      canUpdateTests: false,
      canDeleteTests: false,
      canViewTests: true,
      canGenerateReports: false,
      canApproveReports: false,
      canFinalizeReports: false,
      canViewReports: true,
      canCreateInvoices: false,
      canUpdateInvoices: false,
      canDeleteInvoices: false,
      canViewInvoices: true,
      canManageLabs: false,
      canViewLabs: true,
      canManageHospitals: false,
      canViewHospitals: true,
      canAccessAdminPanel: false,
      canViewSystemLogs: false,
      canManageSystemSettings: false,
    },
  };

  public static getPermissions(role: UserRole): IRolePermissions {
    return this.rolePermissions[role];
  }

  public static hasPermission(
    role: UserRole, 
    permission: keyof IRolePermissions
  ): boolean {
    const permissions = this.getPermissions(role);
    return permissions[permission];
  }

  public static canAccess(
    role: UserRole,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean {
    const permissions = this.getPermissions(role);

    switch (resource.toLowerCase()) {
      case 'users':
        return action === 'create' ? permissions.canCreateUsers :
               action === 'read' ? permissions.canViewUsers :
               action === 'update' ? permissions.canUpdateUsers :
               action === 'delete' ? permissions.canDeleteUsers : false;

      case 'patients':
        return action === 'create' ? permissions.canCreatePatients :
               action === 'read' ? permissions.canViewPatients :
               action === 'update' ? permissions.canUpdatePatients :
               action === 'delete' ? permissions.canDeletePatients : false;

      case 'cases':
        return action === 'create' ? permissions.canCreateCases :
               action === 'read' ? permissions.canViewCases :
               action === 'update' ? permissions.canUpdateCases :
               action === 'delete' ? permissions.canDeleteCases : false;

      case 'samples':
        return action === 'create' ? permissions.canCollectSamples :
               action === 'read' ? permissions.canViewSamples :
               action === 'update' ? permissions.canUpdateSamples :
               action === 'delete' ? permissions.canDeleteSamples : false;

      case 'tests':
        return action === 'create' ? permissions.canCreateTests :
               action === 'read' ? permissions.canViewTests :
               action === 'update' ? permissions.canUpdateTests :
               action === 'delete' ? permissions.canDeleteTests : false;

      case 'reports':
        return action === 'create' ? permissions.canGenerateReports :
               action === 'read' ? permissions.canViewReports :
               action === 'update' ? permissions.canApproveReports :
               action === 'delete' ? false : false;

      case 'invoices':
        return action === 'create' ? permissions.canCreateInvoices :
               action === 'read' ? permissions.canViewInvoices :
               action === 'update' ? permissions.canUpdateInvoices :
               action === 'delete' ? permissions.canDeleteInvoices : false;

      case 'labs':
        return action === 'create' ? permissions.canManageLabs :
               action === 'read' ? permissions.canViewLabs :
               action === 'update' ? permissions.canManageLabs :
               action === 'delete' ? permissions.canManageLabs : false;

      case 'hospitals':
        return action === 'create' ? permissions.canManageHospitals :
               action === 'read' ? permissions.canViewHospitals :
               action === 'update' ? permissions.canManageHospitals :
               action === 'delete' ? permissions.canManageHospitals : false;

      default:
        return false;
    }
  }

  public static getAllRoles(): UserRole[] {
    return Object.values(UserRole);
  }

  public static isValidRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }
}