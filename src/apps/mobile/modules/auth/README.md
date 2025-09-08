# Mobile Auth Module

Simple patient authentication for mobile app users.

## Controllers
- MobileAuthController.ts - Patient login, simple auth, profile access

## Routes
- `/api/mobile/auth/login` - Patient login
- `/api/mobile/auth/register` - Patient registration  
- `/api/mobile/auth/logout` - Patient logout
- `/api/mobile/auth/refresh` - Token refresh

## Middleware
- patient-auth.middleware.ts - Patient-specific authentication
- mobile-rate-limit.middleware.ts - Mobile-specific rate limiting

## Types
- Patient user types
- Mobile session types
- Device registration types

## Validators
- Simple login validation
- Registration validation
- Profile validation