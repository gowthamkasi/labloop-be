// Validation schemas for request body validation
// These schemas are used by Fastify for request validation only
// Examples and detailed descriptions are provided in the route documentation

import { FastifySchema } from 'fastify';

export const LoginSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'User Login',
  description: 'Authenticate user with email and password, returns JWT access and refresh tokens',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
      password: {
        type: 'string',
        minLength: 6,
      },
      rememberMe: {
        type: 'boolean',
        default: false,
      },
    },
    required: ['email', 'password'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Login successful',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'integer' },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const RefreshTokenSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'Refresh Access Token',
  description: 'Generate new access token using valid refresh token',
  body: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['refreshToken'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Token refreshed successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        data: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const ChangePasswordSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'Change Password',
  description: 'Change user password with current password verification',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      currentPassword: {
        type: 'string',
        minLength: 6,
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
      },
    },
    required: ['currentPassword', 'newPassword'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Password changed successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const ForgotPasswordSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'Forgot Password',
  description: 'Send password reset email to user with reset token',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
    },
    required: ['email'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Password reset email sent successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const ResetPasswordSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'Reset Password',
  description: 'Reset user password using valid reset token from email',
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
      },
      resetToken: {
        type: 'string',
        minLength: 1,
      },
      newPassword: {
        type: 'string',
        minLength: 6,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
      },
    },
    required: ['email', 'resetToken', 'newPassword'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Password reset successful',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
    400: {
      description: 'Bad Request',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    404: {
      description: 'Not Found',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const LogoutSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'User Logout',
  description: 'Invalidate refresh token and logout user session',
  headers: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        minLength: 1,
      },
    },
    required: ['refreshToken'],
    additionalProperties: false,
  },
  response: {
    200: {
      description: 'Logout successful',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;

export const MeSchema: FastifySchema = {
  tags: ['Web - Auth'],
  summary: 'Get Current User',
  description: 'Retrieve current authenticated user information',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Current user information retrieved successfully',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        data: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
    401: {
      description: 'Unauthorized',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'integer' },
        message: { type: 'string' },
        error: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  },
} as const;
