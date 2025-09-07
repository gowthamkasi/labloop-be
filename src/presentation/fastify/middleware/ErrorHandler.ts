/**
 * Comprehensive Error Handling Middleware for LabLoop Healthcare System
 * Provides structured error responses with proper logging and healthcare compliance
 */

import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { AppError } from '@/shared/exceptions/AppError.js';
import { HTTP_STATUS } from '@/shared/constants/HttpStatus.js';
import { IApiResponse, IApiError } from '@/shared/types/Api.js';

export interface IErrorHandlerDependencies {
  readonly isDevelopment: boolean;
}

export class ErrorHandler {
  private readonly isDevelopment: boolean;

  constructor(dependencies: IErrorHandlerDependencies) {
    this.isDevelopment = dependencies.isDevelopment;
  }

  public handle = (
    error: FastifyError | AppError | Error,
    request: FastifyRequest,
    reply: FastifyReply
  ): void => {
    const requestId = request.id;
    const timestamp = new Date().toISOString();

    // Handle known application errors
    if (error instanceof AppError) {
      this.handleAppError(error, request, reply, requestId, timestamp);
      return;
    }

    // Handle Fastify validation errors
    if (this.isFastifyValidationError(error)) {
      this.handleValidationError(error as FastifyError, request, reply, requestId, timestamp);
      return;
    }

    // Handle JWT errors
    if (this.isJwtError(error)) {
      this.handleJwtError(error, request, reply, requestId, timestamp);
      return;
    }

    // Handle rate limit errors
    if (this.isRateLimitError(error)) {
      this.handleRateLimitError(error as FastifyError, request, reply, requestId, timestamp);
      return;
    }

    // Handle all other errors as internal server errors
    this.handleInternalError(error, request, reply, requestId, timestamp);
  };

  private handleAppError(
    error: AppError,
    request: FastifyRequest,
    reply: FastifyReply,
    requestId: string,
    timestamp: string
  ): void {
    // Log operational errors as warnings, non-operational as errors
    if (error.isOperational) {
      request.log.warn({
        error: {
          name: error.name,
          message: error.message,
          code: error.errorCode,
          statusCode: error.statusCode,
          field: error.field,
          details: error.details,
        },
        requestId,
      }, `Operational error: ${error.message}`);
    } else {
      request.log.error({
        error: {
          name: error.name,
          message: error.message,
          code: error.errorCode,
          statusCode: error.statusCode,
          stack: this.isDevelopment ? error.stack : undefined,
        },
        requestId,
      }, `System error: ${error.message}`);
    }

    const apiError: IApiError = {
      code: error.errorCode,
      message: error.message,
      details: this.isDevelopment ? error.details : undefined,
      field: error.field,
    };

    const response: IApiResponse = {
      success: false,
      message: error.message,
      error: apiError,
      timestamp,
      requestId,
    };

    reply.code(error.statusCode).send(response);
  }

  private handleValidationError(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
    requestId: string,
    timestamp: string
  ): void {
    request.log.warn({
      error: {
        name: error.name,
        message: error.message,
        validation: error.validation,
        validationContext: error.validationContext,
      },
      requestId,
    }, 'Request validation failed');

    const apiError: IApiError = {
      code: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      details: this.isDevelopment ? {
        validation: error.validation,
        validationContext: error.validationContext,
      } : undefined,
    };

    const response: IApiResponse = {
      success: false,
      message: 'Invalid request data',
      error: apiError,
      timestamp,
      requestId,
    };

    reply.code(HTTP_STATUS.BAD_REQUEST).send(response);
  }

  private handleJwtError(
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply,
    requestId: string,
    timestamp: string
  ): void {
    request.log.warn({
      error: {
        name: error.name,
        message: error.message,
      },
      requestId,
    }, 'JWT authentication failed');

    const apiError: IApiError = {
      code: 'AUTH_TOKEN_INVALID',
      message: 'Invalid or expired authentication token',
    };

    const response: IApiResponse = {
      success: false,
      message: 'Authentication required',
      error: apiError,
      timestamp,
      requestId,
    };

    reply.code(HTTP_STATUS.UNAUTHORIZED).send(response);
  }

  private handleRateLimitError(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
    requestId: string,
    timestamp: string
  ): void {
    request.log.warn({
      error: {
        name: error.name,
        message: error.message,
      },
      clientIp: request.ip,
      requestId,
    }, 'Rate limit exceeded');

    const apiError: IApiError = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    };

    const response: IApiResponse = {
      success: false,
      message: 'Rate limit exceeded',
      error: apiError,
      timestamp,
      requestId,
    };

    reply.code(HTTP_STATUS.TOO_MANY_REQUESTS).send(response);
  }

  private handleInternalError(
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply,
    requestId: string,
    timestamp: string
  ): void {
    // Always log internal errors with full details
    request.log.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: this.sanitizeBody(request.body),
      },
      requestId,
    }, 'Internal server error');

    const apiError: IApiError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: this.isDevelopment 
        ? error.message 
        : 'An unexpected error occurred. Please try again later.',
      details: this.isDevelopment ? {
        name: error.name,
        stack: error.stack,
      } : undefined,
    };

    const response: IApiResponse = {
      success: false,
      message: 'Internal server error',
      error: apiError,
      timestamp,
      requestId,
    };

    reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(response);
  }

  private isFastifyValidationError(error: Error): boolean {
    return error.name === 'FastifyError' && 'validation' in error;
  }

  private isJwtError(error: Error): boolean {
    return error.name === 'JsonWebTokenError' || 
           error.name === 'TokenExpiredError' || 
           error.name === 'NotBeforeError';
  }

  private isRateLimitError(error: Error): boolean {
    return error.name === 'FastifyError' && error.message.includes('Rate limit');
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    const sanitized = { ...body } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Factory function for creating error handler
export function createErrorHandler(isDevelopment: boolean): ErrorHandler {
  return new ErrorHandler({ isDevelopment });
}