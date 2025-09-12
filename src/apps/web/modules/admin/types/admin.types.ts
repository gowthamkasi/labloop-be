import { UserRole, Gender } from '../../../../../shared/types/enums.js';

export interface CreateUserRequest {
  username: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    mobileNumber?: string;
    dateOfBirth?: string;
    gender?: Gender;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  employment?: {
    organizationId: string;
    designation: string;
    department: string;
    joiningDate: string;
    reportingTo?: string;
  };
  permissions?: {
    canCreateCases?: boolean;
    canEditCases?: boolean;
    canDeleteCases?: boolean;
    canCreateReports?: boolean;
    canApproveReports?: boolean;
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canManageInventory?: boolean;
  };
  sendWelcomeEmail?: boolean;
}

export interface CreateUserResponse {
  userId: string;
  username: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    mobileNumber?: string | undefined;
  };
  employment?: {
    organizationId?: string;
    designation?: string;
    department?: string;
  };
  permissions: object;
  temporaryPassword: string;
  status: {
    isActive: boolean;
    isVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  profile?: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    dateOfBirth?: string;
    gender?: Gender;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  employment?: {
    organizationId?: string;
    designation?: string;
    department?: string;
    joiningDate?: string;
    reportingTo?: string;
  };
  permissions?: {
    canCreateCases?: boolean;
    canEditCases?: boolean;
    canDeleteCases?: boolean;
    canCreateReports?: boolean;
    canApproveReports?: boolean;
    canManageUsers?: boolean;
    canViewAnalytics?: boolean;
    canManageInventory?: boolean;
  };
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
  department?: string;
}

export interface UserListResponse {
  users: Array<{
    userId: string;
    username: string;
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    employment?: {
      organizationId: string;
      designation: string;
      department: string;
    };
    status: {
      isActive: boolean;
      isVerified: boolean;
    };
    createdAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
  emailSent: boolean;
}

export interface ActivateUserRequest {
  isActive: boolean;
}
