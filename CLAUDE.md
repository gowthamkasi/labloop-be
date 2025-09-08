# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LabLoop Healthcare Lab Management System - A high-performance Fastify backend with clean architecture designed for healthcare lab management. Built with strict TypeScript compliance for healthcare compliance requirements.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with tsx watch (hot reload)
- `pnpm build` - Compile TypeScript to dist/ using tsconfig.build.json
- `pnpm start` - Run production build from dist/main.js
- `pnpm typecheck` - TypeScript type checking without emitting files
- `pnpm lint` - ESLint with auto-fix for TypeScript files

### Prerequisites
- Node.js >= 20.0.0 (specified in engines)
- pnpm package manager (lock file present)

## Architecture Overview

### Apps-Based Clean Architecture
The codebase follows an apps-based architecture separating business and consumer concerns while sharing common components:

```
src/
├── apps/
│   ├── web/                    # Healthcare provider/business app
│   │   ├── modules/            # Web-specific modules
│   │   ├── middleware/         # Web-specific middleware
│   │   ├── routes/             # Web route aggregation
│   │   └── config/             # Web configuration
│   └── mobile/                 # Consumer/patient app
│       ├── modules/            # Mobile-specific modules
│       ├── middleware/         # Mobile-specific middleware  
│       ├── routes/             # Mobile route aggregation
│       └── config/             # Mobile configuration
├── shared/
│   ├── models/                 # Mongoose schemas (shared)
│   ├── services/               # Core business logic (shared)
│   ├── types/                  # Common TypeScript types
│   ├── validators/             # Base validation schemas
│   ├── utils/                  # Shared utilities
│   ├── middleware/             # Common middleware
│   ├── constants/              # Application constants
│   └── enums/                  # Shared enumerations
├── plugins/                    # Fastify plugins
└── config/                     # Application configuration
```

### App-Specific Module Structure
Each app (web/mobile) contains domain modules with consistent organization:
- `controllers/` - Request handlers (web: admin features, mobile: patient features)
- `routes/` - Route definitions and middleware
- `validators/` - App-specific validation schemas
- `types/` - App-specific TypeScript types

### Shared Components Structure
- `models/` - Mongoose schemas used by both apps
- `services/` - Core business logic shared between apps
- `types/` - Common interfaces and type definitions
- `validators/` - Base validation schemas
- `utils/` - Shared utility functions
- `middleware/` - Common Fastify middleware

### Technology Stack
- **Framework**: Fastify 5.x with comprehensive plugin ecosystem
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens via @fastify/jwt
- **Validation**: Zod schemas for type-safe validation
- **Documentation**: Swagger/OpenAPI via @fastify/swagger
- **Security**: Rate limiting, CORS, Helmet, compression
- **Development**: tsx for hot reloading, strict TypeScript configuration

### Key Architectural Patterns
- **Apps-Based Separation**: Clear separation between business (web) and consumer (mobile) concerns
- **Shared Foundation**: Common models, services, and utilities used by both apps
- **Clean Architecture**: Clear separation between controllers, services, and models
- **Domain-Driven Design**: Business domains organized within each app
- **Plugin-Based**: Extensible via Fastify plugin system
- **Type Safety**: Strict TypeScript with healthcare compliance settings
- **API Documentation**: Auto-generated Swagger documentation with app-specific sections

### Routing Strategy
- **Web App Routes**: `/api/web/*` - Full administrative features for healthcare providers
- **Mobile App Routes**: `/api/mobile/*` - Simplified patient-focused features
- **Health Check**: `/health` - System health monitoring

## TypeScript Configuration

### Strict Healthcare Compliance
The tsconfig.json enforces extremely strict type checking suitable for healthcare applications:
- All strict mode options enabled
- `noUncheckedIndexedAccess` for array safety
- `exactOptionalPropertyTypes` for precise optionals
- `noPropertyAccessFromIndexSignature` for object safety
- Path mapping: `@/*` maps to `src/*`, `@shared/*` to `src/shared/*`, `@web/*` to `src/apps/web/*`, `@mobile/*` to `src/apps/mobile/*`

### Build Configuration
- **Development**: Standard tsconfig.json with source maps and declarations
- **Production**: tsconfig.build.json removes source maps/declarations for optimization
- **Output**: Compiled to `dist/` directory
- **Module System**: ESNext modules with Node resolution

## Core Dependencies

### Fastify Ecosystem
- `@fastify/jwt` - JWT authentication
- `@fastify/mongodb` - MongoDB integration
- `@fastify/swagger` - API documentation
- `@fastify/cors`, `@fastify/helmet` - Security
- `@fastify/rate-limit` - Rate limiting
- `@fastify/multipart` - File uploads

### Database & Validation
- `mongoose` - MongoDB ODM with schemas
- `zod` - Runtime type validation
- `jsonwebtoken` - JWT token handling

### Development Tools
- `tsx` - TypeScript execution for development
- ESLint with TypeScript support
- Pino logging with pretty printing for development

## Healthcare Domain Context

This system manages the complete healthcare lab workflow including:
- **Patient Management**: Patient records and medical history
- **Case Management**: Lab orders, test requests, and case tracking
- **Sample Processing**: Chain of custody, batch processing, sample tracking
- **Report Generation**: Test results, document processing, report distribution
- **Facility Management**: Hospitals, labs, collection centers, clinics
- **Appointment System**: Test scheduling, slot management, booking offers
- **Analytics**: Health insights and trend analysis
- **Billing**: Invoice generation and payment processing

The apps-based architecture allows web and mobile applications to evolve independently while sharing core healthcare domain logic, maintaining strict type safety and compliance standards.

## File Structure Reference

For detailed information about the new structure, see:
- `docs/apps-structure.md` - Complete implementation guide and folder structure
- `src/apps/web/README.md` - Web app features and modules
- `src/apps/mobile/README.md` - Mobile app features and modules  
- `src/shared/README.md` - Shared components overview