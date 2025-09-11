import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { LoginSchema, RefreshTokenSchema } from '../swagger/auth.schema.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', {
    schema: {
      body: LoginSchema,
    },
    handler: AuthController.login,
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      body: RefreshTokenSchema,
    },
    handler: AuthController.refresh,
  });

  // Logout
  fastify.post('/logout', {
    schema: {},
    handler: AuthController.logout,
  });

  // Get current user (protected)
  fastify.get('/me', {
    preHandler: authMiddleware,
    handler: AuthController.me,
  });

  // Change password (protected)
  fastify.post('/change-password', {
    preHandler: [authMiddleware],
    handler: AuthController.changePassword,
  });

  // Forgot password
  fastify.post('/forgot-password', {
    handler: AuthController.forgotPassword,
  });

  // Reset password
  fastify.post('/reset-password', {
    handler: AuthController.resetPassword,
  });
}
