export const LoginSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      transform: ['toLowerCase'],
    },
    password: {
      type: 'string',
      minLength: 6,
      description: 'User password (minimum 6 characters)',
    },
    rememberMe: {
      type: 'boolean',
      default: false,
      description: 'Whether to remember the user session',
    },
  },
  required: ['email', 'password'],
  additionalProperties: false,
} as const;

export const RefreshTokenSchema = {
  type: 'object',
  properties: {
    refreshToken: {
      type: 'string',
      minLength: 1,
      description: 'JWT refresh token',
    },
  },
  required: ['refreshToken'],
  additionalProperties: false,
} as const;

export const ChangePasswordSchema = {
  type: 'object',
  properties: {
    currentPassword: {
      type: 'string',
      minLength: 6,
      description: 'Current password (minimum 6 characters)',
    },
    newPassword: {
      type: 'string',
      minLength: 6,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
      description:
        'New password with at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  },
  required: ['currentPassword', 'newPassword'],
  additionalProperties: false,
} as const;

export const ForgotPasswordSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      transform: ['toLowerCase'],
    },
  },
  required: ['email'],
  additionalProperties: false,
} as const;

export const ResetPasswordSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address',
      transform: ['toLowerCase'],
    },
    resetToken: {
      type: 'string',
      minLength: 1,
      description: 'Password reset token',
    },
    newPassword: {
      type: 'string',
      minLength: 6,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
      description:
        'New password with at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  },
  required: ['email', 'resetToken', 'newPassword'],
  additionalProperties: false,
} as const;
