import { FastifyReply } from 'fastify';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface ApiError {
  code: string;
  details?: unknown;
}

export class ResponseHelper {
  static sendSuccess<T>(
    reply: FastifyReply,
    data?: T,
    message: string = 'Success',
    statusCode: number = 200
  ): FastifyReply {
    const response: ApiResponse<T> = {
      success: true,
      statusCode,
      message,
      ...(data !== undefined && { data }),
    };

    return reply.code(statusCode).send(response);
  }

  static sendError(
    reply: FastifyReply,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: unknown
  ): FastifyReply {
    const response: ApiResponse = {
      success: false,
      statusCode,
      message,
      error: {
        code: errorCode,
        ...(details !== undefined && { details }),
      },
    };

    return reply.code(statusCode).send(response);
  }

  static sendCreated<T>(
    reply: FastifyReply,
    data?: T,
    message: string = 'Resource created successfully'
  ): FastifyReply {
    return this.sendSuccess(reply, data, message, 201);
  }

  static sendNoContent(
    reply: FastifyReply,
    message: string = 'No content'
  ): FastifyReply {
    return this.sendSuccess(reply, undefined, message, 204);
  }

  static sendBadRequest(
    reply: FastifyReply,
    message: string = 'Bad request',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 400, 'BAD_REQUEST', details);
  }

  static sendUnauthorized(
    reply: FastifyReply,
    message: string = 'Unauthorized',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 401, 'UNAUTHORIZED', details);
  }

  static sendForbidden(
    reply: FastifyReply,
    message: string = 'Forbidden',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 403, 'FORBIDDEN', details);
  }

  static sendNotFound(
    reply: FastifyReply,
    message: string = 'Resource not found',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 404, 'NOT_FOUND', details);
  }

  static sendConflict(
    reply: FastifyReply,
    message: string = 'Resource already exists',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 409, 'CONFLICT', details);
  }

  static sendUnprocessableEntity(
    reply: FastifyReply,
    message: string = 'Validation failed',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 422, 'VALIDATION_FAILED', details);
  }

  static sendTooManyRequests(
    reply: FastifyReply,
    message: string = 'Too many requests',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 429, 'TOO_MANY_REQUESTS', details);
  }

  static sendInternalError(
    reply: FastifyReply,
    message: string = 'Internal server error',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 500, 'INTERNAL_ERROR', details);
  }

  static sendServiceUnavailable(
    reply: FastifyReply,
    message: string = 'Service unavailable',
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, 503, 'SERVICE_UNAVAILABLE', details);
  }

  static sendCustomError(
    reply: FastifyReply,
    statusCode: number,
    errorCode: string,
    message: string,
    details?: unknown
  ): FastifyReply {
    return this.sendError(reply, message, statusCode, errorCode, details);
  }
}

export const {
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
  sendUnprocessableEntity,
  sendTooManyRequests,
  sendInternalError,
  sendServiceUnavailable,
  sendCustomError,
} = ResponseHelper;