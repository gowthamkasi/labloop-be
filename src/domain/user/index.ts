/**
 * User Domain Module - Core user business logic and domain entities
 * Handles authentication, authorization, and role-based permissions
 */

export * from './valueObjects/index.js';
export * from './services/index.js';
export * from './exceptions/index.js';
export * from './events/index.js';

// Domain aggregates and entities
export * from './UserAggregate.js';
export * from './UserEntity.js';
export * from './UserPermissions.js';
export * from './UserRoles.js';