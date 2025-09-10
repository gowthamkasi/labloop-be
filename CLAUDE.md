# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LabLoop Healthcare Lab Management System - A high-performance Fastify backend with clean architecture designed for healthcare lab management. Built with strict TypeScript compliance for healthcare compliance requirements.

## Development Commands

### Core Development

- `pnpm run dev` - Start development server with tsx watch (hot reload)
- `pnpm run build` - Compile TypeScript to dist/ using tsconfig.build.json
- `pnpm start` - Run production build from dist/index.js
- `pnpm run typecheck` - TypeScript type checking without emitting files
- `pnpm run lint` - ESLint with auto-fix for TypeScript files

### Health & Testing

- Health check available at `/health` endpoint when server is running
- Database connection info included in health check response

### Prerequisites

- Node.js >= 20.0.0 (specified in engines)
- pnpm package manager (lock file present)
- MongoDB running locally or accessible via MONGODB_URI

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
- **Logging**: Pino with pretty printing for development

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
- **Root Endpoint**: `/` - API overview with available apps and endpoints

### Key Route Differences

**Web App Examples:**

- `/api/web/patients` - Full patient management for staff
- `/api/web/cases` - Complete case management workflow
- `/api/web/reports` - All reports management and processing
- `/api/web/facilities` - Full facility administration

**Mobile App Examples:**

- `/api/mobile/patients/me` - Patient's own profile only
- `/api/mobile/reports/my` - Patient's own reports only
- `/api/mobile/facilities/search` - Find nearby facilities only
- `/api/mobile/appointments` - Simple booking interface

## TypeScript Configuration

### Strict Healthcare Compliance

The tsconfig.json enforces extremely strict type checking suitable for healthcare applications:

- All strict mode options enabled
- `noUncheckedIndexedAccess` for array safety
- `exactOptionalPropertyTypes` for precise optionals
- `noPropertyAccessFromIndexSignature` for object safety
- Path mapping: `@/*` maps to `src/*` for clean imports

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
- `pino-pretty` - Pretty printing for development logs
- `dotenv` - Environment variable management

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

## Database Configuration

The system uses a singleton database connection pattern with:

- Connection pooling (2-10 connections) for optimal performance
- Automatic reconnection handling with event listeners
- Graceful shutdown support for SIGTERM/SIGINT signals
- Health check integration at `/health` endpoint
- Connection timeout and retry configuration for reliability

### Database Connection Features

- **Singleton Pattern**: Single shared connection instance across the application
- **Event Handling**: Connected, disconnected, error, and reconnected events
- **Health Monitoring**: Real-time connection status via `database.isHealthy()`
- **Graceful Shutdown**: Proper cleanup on application termination

## Environment Variables

Required environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/labloop
PORT=3000
HOST=0.0.0.0
```

## Core Business Entities

The system models the complete healthcare lab ecosystem:

### Primary Entities

- **User**: Base user model with authentication and role management
- **Patient**: Patient profiles, medical history, and personal information
- **Doctor**: Doctor credentials, specializations, and facility associations
- **Case**: Central workflow entity linking patients, tests, and facilities

### Facility Types

- **Hospital**: Healthcare facilities with multiple departments
- **Lab**: Testing laboratories with specific capabilities
- **Clinic**: Medical clinics and outpatient facilities
- **Collection Center**: Sample collection points and locations

### Lab Operations

- **Sample**: Physical specimens with chain of custody tracking
- **Report**: Test results, documents, and analysis data
- **Test**: Test definitions, parameters, and methodologies
- **Appointment**: Patient scheduling and slot management

### Business Operations

- **Invoice**: Billing, payments, and financial tracking
- **Organization**: Multi-facility healthcare organizations
- **Analytics**: Health insights, trends, and reporting data

## File Structure Reference

For detailed information about the apps-based architecture, see:

- `docs/apps-structure.md` - Complete implementation guide and folder structure
- `src/apps/web/README.md` - Web app features and modules
- `src/apps/mobile/README.md` - Mobile app features and modules
- `src/shared/README.md` - Shared components overview
- `src/shared/models/README.md` - Database schema documentation
- `src/shared/services/README.md` - Business logic services
- `src/plugins/README.md` - Fastify plugin system
- `src/config/README.md` - Configuration management
