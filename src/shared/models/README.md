# Shared Models

Mongoose schemas used by both web and mobile applications.

## Database Models

### Core Entities
- **User.model.ts** - Base user model with common fields
- **Patient.model.ts** - Patient information and medical history
- **Doctor.model.ts** - Doctor profiles and credentials

### Facilities
- **Hospital.model.ts** - Hospital information and departments
- **Lab.model.ts** - Laboratory details and capabilities
- **Clinic.model.ts** - Clinic information and services
- **CollectionCenter.model.ts** - Sample collection centers

### Lab Operations  
- **Case.model.ts** - Lab cases and workflows
- **Sample.model.ts** - Sample information and tracking
- **SampleBatch.model.ts** - Sample batch processing
- **Report.model.ts** - Test reports and results
- **ReportDocument.model.ts** - Report document storage

### Testing
- **Test.model.ts** - Test definitions and parameters
- **TestSection.model.ts** - Test sections and categories

### Scheduling
- **Appointment.model.ts** - Patient appointments
- **AppointmentSlot.model.ts** - Available time slots

### Business
- **Invoice.model.ts** - Billing and invoicing
- **Organization.model.ts** - Organization details
- **Review.model.ts** - Organization reviews and ratings

## Schema Features
- Consistent validation rules
- Audit fields (createdAt, updatedAt, createdBy)
- Soft delete support
- Index optimization for performance
- Data encryption for sensitive fields