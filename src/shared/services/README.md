# Shared Services

Core business logic services used by both web and mobile applications.

## Service Categories

### Authentication Services
- **AuthService.ts** - Authentication logic, token management
- **TokenService.ts** - JWT token operations, refresh logic

### Patient Services  
- **PatientService.ts** - Patient CRUD, medical history, profile management

### Facility Services
- **HospitalService.ts** - Hospital management, department operations
- **LabService.ts** - Laboratory operations, capabilities management
- **ClinicService.ts** - Clinic management and services
- **CollectionCenterService.ts** - Collection center operations

### Case Management Services
- **CaseService.ts** - Case workflows, status management, assignments
- **CaseAttachmentService.ts** - File attachments, document management

### Sample Services
- **SampleService.ts** - Sample tracking, status updates
- **SampleBatchService.ts** - Batch processing, quality control
- **SampleTrackingService.ts** - Chain of custody tracking
- **SampleCustodyService.ts** - Sample custody management

### Report Services
- **ReportService.ts** - Report generation, distribution
- **ReportDocumentService.ts** - Document storage, retrieval
- **ReportProcessingService.ts** - Report processing workflows

### Appointment Services
- **AppointmentService.ts** - Appointment management, scheduling
- **SlotService.ts** - Time slot management, availability
- **BookingService.ts** - Booking operations, confirmations
- **OfferService.ts** - Special offers and promotions

### Test Services
- **TestService.ts** - Test management, execution
- **TestCatalogService.ts** - Test catalog, search operations
- **TestPricingService.ts** - Pricing management, calculations
- **TestSectionService.ts** - Test categorization, sections

### Doctor Services
- **DoctorService.ts** - Doctor profile management
- **DoctorAssociationService.ts** - Hospital/clinic associations
- **DoctorOrganizationService.ts** - Organization memberships

### Analytics Services
- **AnalyticsService.ts** - Business analytics, KPIs
- **HealthInsightsService.ts** - Health trend analysis
- **TrendsService.ts** - Data trend analysis

### Business Services
- **InvoiceService.ts** - Invoice generation, payment tracking
- **OrganizationService.ts** - Organization management
- **ReviewService.ts** - Review and rating management
- **UserService.ts** - User management operations

## Service Features
- Consistent error handling
- Transaction support
- Caching integration
- Audit logging
- Permission checks
- Data validation