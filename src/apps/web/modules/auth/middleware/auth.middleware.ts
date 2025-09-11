import { FastifyReply, FastifyRequest } from 'fastify';
import { JWTPayload } from '../types/auth.types.js';

// Simple auth middleware for protected routes
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    request.log.info('inside authMiddleware');

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      request.log.info('Authorization header required');
      return reply.code(401).send({
        success: false,
        statusCode: 401,
        message: 'Authorization header required',
        error: { code: 'UNAUTHORIZED' },
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    request.user = decoded;
  } catch (error: unknown) {
    if (error instanceof Error) {
      request.log.error(error.message);
    } else {
      request.log.error(error);
    }

    return reply.code(401).send({
      success: false,
      statusCode: 401,
      message: 'Invalid or expired token',
      error: { code: 'UNAUTHORIZED' },
      timestamp: new Date().toISOString(),
    });
  }
}
