/**
 * Base Application Error for the LabLoop Healthcare System
 */

import { ErrorCode, HttpStatusCode, HTTP_STATUS } from '@/shared/constants/index.js';

export abstract class AppError extends Error {
  public readonly isOperational: boolean = true;
  public readonly timestamp: Date = new Date();
  public readonly requestId?: string;

  constructor(
    public override readonly message: string,
    public readonly statusCode: HttpStatusCode,
    public readonly errorCode: ErrorCode,
    public readonly details?: Record<string, unknown> | undefined,
    public readonly field?: string | undefined,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      field: this.field,
      timestamp: this.timestamp.toISOString(),
      requestId: this.requestId,
      isOperational: this.isOperational,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      'VALIDATION_INVALID_VALUE',
      details,
      field
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    
    super(
      message,
      HTTP_STATUS.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      { resource, identifier }
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(
      message,
      HTTP_STATUS.UNAUTHORIZED,
      'AUTH_INVALID_CREDENTIALS'
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      'AUTH_INSUFFICIENT_PERMISSIONS'
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      'RESOURCE_ALREADY_EXISTS',
      details
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'DATABASE_QUERY_ERROR',
      details,
      undefined,
      false // Not operational - infrastructure issue
    );
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(
      `External service '${service}' error: ${message}`,
      HTTP_STATUS.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
      { service, ...details },
      undefined,
      false
    );
  }
}