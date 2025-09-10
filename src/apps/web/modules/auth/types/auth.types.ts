export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    role: string;
    userType: string;
    profile: {
      firstName: string;
      lastName: string;
      mobileNumber?: string;
    };
    employment?: {
      organizationId: string;
      designation: string;
      department: string;
    };
    permissions: {
      canCreateCases: boolean;
      canEditCases: boolean;
      canDeleteCases: boolean;
      canCreateReports: boolean;
      canApproveReports: boolean;
      canManageUsers: boolean;
      canViewAnalytics: boolean;
      canManageInventory: boolean;
    };
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  userType: string;
  iat?: number;
  exp?: number;
}