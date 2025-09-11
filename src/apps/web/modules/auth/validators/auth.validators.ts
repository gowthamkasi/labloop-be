import { z } from 'zod';

export const LoginValidator = z.object({
  email: z.email('Invalid email format').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false),
});

export const RefreshTokenValidator = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ChangePasswordValidator = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export const ForgotPasswordValidator = z.object({
  email: z.email('Invalid email format').toLowerCase(),
});

export const ResetPasswordValidator = z.object({
  email: z.email('Invalid email format').toLowerCase(),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});
