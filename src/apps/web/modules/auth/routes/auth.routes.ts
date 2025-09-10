import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';
import {
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../validators/auth.validators.js';
import { validateBody } from '../../../../../shared/utils/validation.helper.js';

// Simple auth middleware for protected routes
async function authMiddleware(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        statusCode: 401,
        message: 'Authorization header required',
        error: { code: 'UNAUTHORIZED' },
      });
    }

    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
      error: { code: 'UNAUTHORIZED' },
    });
  }
}

export async function authRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // Login
  fastify.post('/login', {
    preValidation: validateBody(LoginSchema),
    handler: AuthController.login,
  });

  // Refresh token
  fastify.post('/refresh', {
    preValidation: validateBody(RefreshTokenSchema),
    handler: AuthController.refresh,
  });

  // Logout
  fastify.post('/logout', {
    preValidation: validateBody(RefreshTokenSchema),
    handler: AuthController.logout,
  });

  // Get current user (protected)
  fastify.get('/me', {
    preHandler: authMiddleware,
    handler: AuthController.me,
  });

  // Change password (protected)
  fastify.post('/change-password', {
    preHandler: [authMiddleware, validateBody(ChangePasswordSchema)],
    handler: AuthController.changePassword,
  });

  // Forgot password
  fastify.post('/forgot-password', {
    preValidation: validateBody(ForgotPasswordSchema),
    handler: AuthController.forgotPassword,
  });

  // Reset password
  fastify.post('/reset-password', {
    preValidation: validateBody(ResetPasswordSchema),
    handler: AuthController.resetPassword,
  });
}
