# Web Auth Module

Administrative authentication and authorization for healthcare providers.

## Controllers
- WebAuthController.ts - Admin login, role management, session handling

## Routes  
- `/api/web/auth/login` - Admin login
- `/api/web/auth/logout` - Admin logout
- `/api/web/auth/refresh` - Token refresh
- `/api/web/auth/roles` - Role management

## Middleware
- admin-auth.middleware.ts - Admin-specific authentication
- role-check.middleware.ts - Role-based access control

## Types
- Admin user types
- Role definitions
- Permission structures

## Validators
- Login validation
- Role assignment validation
- Permission validation