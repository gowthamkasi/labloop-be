import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  LogoutSchema,
  MeSchema,
} from './auth.schema.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', {
    schema: LoginSchema,
    handler: AuthController.login,
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: RefreshTokenSchema,
    handler: AuthController.refresh,
  });

  // Logout
  fastify.post('/logout', {
    schema: LogoutSchema,
    handler: AuthController.logout,
  });

  // Get current user (protected)
  fastify.get('/me', {
    schema: MeSchema,
    preHandler: authMiddleware,
    handler: AuthController.me,
  });

  // Change password (protected)
  fastify.post('/change-password', {
    schema: ChangePasswordSchema,
    preHandler: [authMiddleware],
    handler: AuthController.changePassword,
  });

  // Forgot password
  fastify.post('/forgot-password', {
    schema: ForgotPasswordSchema,
    handler: AuthController.forgotPassword,
  });

  // Reset password
  fastify.post('/reset-password', {
    schema: ResetPasswordSchema,
    handler: AuthController.resetPassword,
  });
}
