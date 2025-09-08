# Shared Components

This directory contains all shared components used by both web and mobile applications.

## Structure

### models/
Mongoose schemas and database models shared by both apps
- User.model.ts
- Patient.model.ts  
- Hospital.model.ts
- Lab.model.ts
- Case.model.ts
- Sample.model.ts
- Report.model.ts
- Test.model.ts
- Appointment.model.ts
- Invoice.model.ts

### services/
Core business logic services shared across applications
- AuthService - Authentication logic
- PatientService - Patient operations
- HospitalService - Hospital management
- CaseService - Case workflows
- SampleService - Sample tracking
- ReportService - Report processing
- AppointmentService - Appointment management

### types/
Common TypeScript interfaces and type definitions
- API response types
- Database entity types
- Validation schemas
- Enum definitions

### validators/
Zod validation schemas for request validation
- Base validators
- Entity-specific validators
- Common validation rules

### utils/
Shared utility functions
- Database utilities
- Authentication helpers
- Date/time utilities
- File processing utilities
- Encryption utilities

### middleware/
Common Fastify middleware
- Error handling
- Logging
- Request validation
- CORS handling
- Rate limiting

### constants/
Application constants and enums
- User roles
- Status codes
- Error codes
- API versions