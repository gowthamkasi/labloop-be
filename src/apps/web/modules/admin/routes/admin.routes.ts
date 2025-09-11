import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { UserController } from '../controllers/UserController.js';
import { JWTPayload } from '../../auth/types/auth.types.js';

// Admin middleware - only admins can access these routes
async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
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

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    request.user = decoded;

    // Check if user has admin permissions
    if (decoded.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        statusCode: 403,
        message: 'Admin access required',
        error: { code: 'FORBIDDEN' },
      });
    }
  } catch (error) {
    return reply.code(401).send({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
      error: { code: 'UNAUTHORIZED' },
    });
  }
}

// Manager middleware - admins and managers can access
async function managerMiddleware(request: FastifyRequest, reply: FastifyReply) {
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

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    request.user = decoded;

    // Check if user has admin or manager permissions
    if (!['admin', 'lab_manager'].includes(decoded.role)) {
      return reply.code(403).send({
        success: false,
        statusCode: 403,
        message: 'Manager access required',
        error: { code: 'FORBIDDEN' },
      });
    }
  } catch (error) {
    return reply.code(401).send({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
      error: { code: 'UNAUTHORIZED' },
    });
  }
}

export async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // User Management Routes
  fastify.register(
    async function (fastify) {
      // Create user (admin only)
      fastify.post('/users', {
        preHandler: adminMiddleware,
        handler: UserController.createUser,
      });

      // List users (admin/manager)
      fastify.get('/users', {
        preHandler: managerMiddleware,
        handler: UserController.getUsers,
      });

      // Get specific user (admin/manager)
      fastify.get('/users/:userId', {
        preHandler: managerMiddleware,
        handler: UserController.getUser,
      });

      // Update user (admin/manager)
      fastify.patch('/users/:userId', {
        preHandler: managerMiddleware,
        handler: UserController.updateUser,
      });

      // Activate/Deactivate user (admin only)
      fastify.post('/users/:userId/activate', {
        preHandler: adminMiddleware,
        handler: UserController.activateUser,
      });

      // Reset user password (admin only)
      fastify.post('/users/:userId/reset-password', {
        preHandler: adminMiddleware,
        handler: UserController.resetUserPassword,
      });

      // Soft delete user (admin only)
      fastify.delete('/users/:userId', {
        preHandler: adminMiddleware,
        handler: UserController.deleteUser,
      });
    },
    { prefix: '/admin' }
  );
}
