/**
 * User Domain Exceptions
 * Business-specific exceptions for user domain operations
 */

import { AppError } from '@/shared/exceptions/AppError.js';
import { HttpStatus } from '@/shared/constants/HttpStatus.js';

export class UserDomainError extends AppError {
  constructor(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    errorCode?: string
  ) {
    super(message, statusCode, errorCode);
    this.name = 'UserDomainError';
  }
}

export class InvalidUserDataError extends UserDomainError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_USER_DATA');
    this.name = 'InvalidUserDataError';
  }
}

export class UserNotFoundError extends UserDomainError {
  constructor(identifier?: string) {
    const message = identifier 
      ? `User with identifier '${identifier}' not found`
      : 'User not found';
    super(message, HttpStatus.NOT_FOUND, 'USER_NOT_FOUND');
    this.name = 'UserNotFoundError';
  }
}

export class UserAlreadyExistsError extends UserDomainError {
  constructor(field: string, value: string) {
    super(
      `User with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
      'USER_ALREADY_EXISTS'
    );
    this.name = 'UserAlreadyExistsError';
  }
}

export class UnauthorizedAccessError extends UserDomainError {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED_ACCESS');
    this.name = 'UnauthorizedAccessError';
  }
}

export class AccountLockedError extends UserDomainError {
  constructor(message: string = 'Account is locked') {
    super(message, HttpStatus.LOCKED, 'ACCOUNT_LOCKED');
    this.name = 'AccountLockedError';
  }
}

export class InvalidCredentialsError extends UserDomainError {
  constructor() {
    super(
      'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
      'INVALID_CREDENTIALS'
    );
    this.name = 'InvalidCredentialsError';
  }
}

export class InsufficientPermissionsError extends UserDomainError {
  constructor(action?: string, resource?: string) {
    const message = action && resource 
      ? `Insufficient permissions to ${action} ${resource}`
      : 'Insufficient permissions';
    super(message, HttpStatus.FORBIDDEN, 'INSUFFICIENT_PERMISSIONS');
    this.name = 'InsufficientPermissionsError';
  }
}

export class InvalidTokenError extends UserDomainError {
  constructor(message: string = 'Invalid or expired token') {
    super(message, HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
    this.name = 'InvalidTokenError';
  }
}

export class PasswordRequirementsError extends UserDomainError {
  constructor(requirements: string[]) {
    const message = `Password must meet the following requirements: ${requirements.join(', ')}`;
    super(message, HttpStatus.BAD_REQUEST, 'PASSWORD_REQUIREMENTS_NOT_MET');
    this.name = 'PasswordRequirementsError';
  }
}

export class HipaaComplianceError extends UserDomainError {
  constructor(message: string) {
    super(`HIPAA Compliance Error: ${message}`, HttpStatus.FORBIDDEN, 'HIPAA_COMPLIANCE_ERROR');
    this.name = 'HipaaComplianceError';
  }
}