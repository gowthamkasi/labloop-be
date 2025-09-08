# Apps Structure Documentation

## Overview

This document outlines the complete restructuring of the LabLoop backend from a monolithic module structure to an apps-based architecture that separates business (web) and consumer (mobile) concerns while sharing common models and business logic.

## Complete Folder Structure

```
src/
├── apps/
│   ├── web/                     # Healthcare provider/business app
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── WebAuthController.ts      # Admin login, role management
│   │   │   │   ├── routes/
│   │   │   │   │   └── auth.routes.ts             # /api/web/auth/*
│   │   │   │   ├── middleware/
│   │   │   │   │   └── admin-auth.middleware.ts   # Admin-specific auth
│   │   │   │   ├── validators/
│   │   │   │   │   └── web-auth.validators.ts     # Business auth validation
│   │   │   │   └── types/
│   │   │   │       └── web-auth.types.ts          # Admin user types
│   │   │   ├── patients/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── WebPatientsController.ts   # Full CRUD, admin view
│   │   │   │   ├── routes/
│   │   │   │   │   └── patients.routes.ts
│   │   │   │   ├── validators/
│   │   │   │   │   └── web-patients.validators.ts
│   │   │   │   └── types/
│   │   │   │       └── web-patients.types.ts
│   │   │   ├── facilities/
│   │   │   │   ├── hospitals/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebHospitalsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   └── hospitals.routes.ts
│   │   │   │   │   ├── validators/
│   │   │   │   │   │   └── web-hospitals.validators.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── web-hospitals.types.ts
│   │   │   │   ├── labs/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebLabsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── clinics/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── collection-centers/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── gallery/
│   │   │   │   ├── certifications/
│   │   │   │   └── relationships/
│   │   │   ├── cases/
│   │   │   │   ├── management/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebCaseManagementController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   └── case-management.routes.ts
│   │   │   │   │   ├── validators/
│   │   │   │   │   │   └── web-case-management.validators.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── web-case-management.types.ts
│   │   │   │   └── attachments/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebCaseAttachmentsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── samples/
│   │   │   │   ├── batches/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebSampleBatchesController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── custody/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebSampleCustodyController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── tracking/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebSampleTrackingController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── reports/
│   │   │   │   ├── documents/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebReportDocumentsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── processing/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebReportProcessingController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── results/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebReportResultsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── doctors/
│   │   │   │   ├── profiles/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebDoctorProfilesController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── associations/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebDoctorAssociationsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── organization/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebDoctorOrganizationController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── appointments/
│   │   │   │   ├── bookings/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebAppointmentBookingsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── slots/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebAppointmentSlotsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── offers/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebAppointmentOffersController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── tests/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebAppointmentTestsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── tests/
│   │   │   │   ├── catalog/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebTestCatalogController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   ├── pricing/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebTestPricingController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── sections/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebTestSectionsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── invoices/
│   │   │   │   ├── controllers/
│   │   │   │   │   └── WebInvoicesController.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── invoices.routes.ts
│   │   │   │   ├── validators/
│   │   │   │   │   └── web-invoices.validators.ts
│   │   │   │   └── types/
│   │   │   │       └── web-invoices.types.ts
│   │   │   ├── analytics/
│   │   │   │   ├── health-insights/
│   │   │   │   │   ├── controllers/
│   │   │   │   │   │   └── WebHealthInsightsController.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   ├── validators/
│   │   │   │   │   └── types/
│   │   │   │   └── trends/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebTrendsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   ├── organizations/
│   │   │   │   └── reviews/
│   │   │   │       ├── controllers/
│   │   │   │       │   └── WebOrganizationReviewsController.ts
│   │   │   │       ├── routes/
│   │   │   │       ├── validators/
│   │   │   │       └── types/
│   │   │   └── users/
│   │   │       ├── controllers/
│   │   │       │   └── WebUsersController.ts
│   │   │       ├── routes/
│   │   │       │   └── users.routes.ts
│   │   │       ├── validators/
│   │   │       │   └── web-users.validators.ts
│   │   │       └── types/
│   │   │           └── web-users.types.ts
│   │   ├── middleware/
│   │   │   ├── web-auth.middleware.ts
│   │   │   ├── role-check.middleware.ts
│   │   │   ├── audit-log.middleware.ts
│   │   │   └── admin-access.middleware.ts
│   │   ├── routes/
│   │   │   └── index.ts                           # Web routes aggregator
│   │   └── config/
│   │       └── web-config.ts
│   │
│   └── mobile/                  # Consumer/patient app
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── controllers/
│       │   │   │   └── MobileAuthController.ts    # Patient login, simple auth
│       │   │   ├── routes/
│       │   │   │   └── auth.routes.ts             # /api/mobile/auth/*
│       │   │   ├── middleware/
│       │   │   │   └── patient-auth.middleware.ts # Patient-specific auth
│       │   │   ├── validators/
│       │   │   │   └── mobile-auth.validators.ts  # Simple patient validation
│       │   │   └── types/
│       │   │       └── mobile-auth.types.ts       # Patient user types
│       │   ├── patients/
│       │   │   ├── controllers/
│       │   │   │   └── MobilePatientsController.ts # Profile view/edit only
│       │   │   ├── routes/
│       │   │   │   └── patients.routes.ts
│       │   │   ├── validators/
│       │   │   │   └── mobile-patients.validators.ts
│       │   │   └── types/
│       │   │       └── mobile-patients.types.ts
│       │   ├── appointments/
│       │   │   ├── bookings/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileBookingsController.ts # Book appointments
│       │   │   │   ├── routes/
│       │   │   │   │   └── bookings.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-bookings.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-bookings.types.ts
│       │   │   ├── slots/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileSlotsController.ts    # View available slots
│       │   │   │   ├── routes/
│       │   │   │   │   └── slots.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-slots.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-slots.types.ts
│       │   │   ├── offers/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileOffersController.ts   # View special offers
│       │   │   │   ├── routes/
│       │   │   │   ├── validators/
│       │   │   │   └── types/
│       │   │   └── tests/
│       │   │       ├── controllers/
│       │   │       │   └── MobileAppointmentTestsController.ts
│       │   │       ├── routes/
│       │   │       ├── validators/
│       │   │       └── types/
│       │   ├── reports/
│       │   │   ├── results/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileResultsController.ts  # View own reports
│       │   │   │   ├── routes/
│       │   │   │   │   └── results.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-results.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-results.types.ts
│       │   │   └── documents/                         # Download reports
│       │   │       ├── controllers/
│       │   │       │   └── MobileDocumentsController.ts
│       │   │       ├── routes/
│       │   │       │   └── documents.routes.ts
│       │   │       ├── validators/
│       │   │       │   └── mobile-documents.validators.ts
│       │   │       └── types/
│       │   │           └── mobile-documents.types.ts
│       │   ├── tests/
│       │   │   ├── catalog/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileTestCatalogController.ts # Browse tests
│       │   │   │   ├── routes/
│       │   │   │   │   └── catalog.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-catalog.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-catalog.types.ts
│       │   │   ├── pricing/                           # View test prices
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileTestPricingController.ts
│       │   │   │   ├── routes/
│       │   │   │   │   └── pricing.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-pricing.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-pricing.types.ts
│       │   │   └── sections/
│       │   │       ├── controllers/
│       │   │       │   └── MobileTestSectionsController.ts
│       │   │       ├── routes/
│       │   │       ├── validators/
│       │   │       └── types/
│       │   ├── facilities/
│       │   │   ├── labs/
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileLabsController.ts     # Find nearby labs
│       │   │   │   ├── routes/
│       │   │   │   │   └── labs.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-labs.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-labs.types.ts
│       │   │   ├── collection-centers/                # Find collection centers
│       │   │   │   ├── controllers/
│       │   │   │   │   └── MobileCollectionCentersController.ts
│       │   │   │   ├── routes/
│       │   │   │   │   └── collection-centers.routes.ts
│       │   │   │   ├── validators/
│       │   │   │   │   └── mobile-collection-centers.validators.ts
│       │   │   │   └── types/
│       │   │   │       └── mobile-collection-centers.types.ts
│       │   │   └── clinics/
│       │   │       ├── controllers/
│       │   │       │   └── MobileClinicsController.ts
│       │   │       ├── routes/
│       │   │       ├── validators/
│       │   │       └── types/
│       │   ├── analytics/
│       │   │   └── health-insights/
│       │   │       ├── controllers/
│       │   │       │   └── MobileHealthInsightsController.ts # Personal insights
│       │   │       ├── routes/
│       │   │       │   └── health-insights.routes.ts
│       │   │       ├── validators/
│       │   │       │   └── mobile-health-insights.validators.ts
│       │   │       └── types/
│       │   │           └── mobile-health-insights.types.ts
│       │   └── users/
│       │       ├── controllers/
│       │       │   └── MobileUsersController.ts       # Profile management
│       │       ├── routes/
│       │       │   └── users.routes.ts
│       │       ├── validators/
│       │       │   └── mobile-users.validators.ts
│       │       └── types/
│       │           └── mobile-users.types.ts
│       ├── middleware/
│       │   ├── mobile-auth.middleware.ts
│       │   ├── patient-data-filter.middleware.ts
│       │   ├── rate-limit-mobile.middleware.ts
│       │   └── mobile-cors.middleware.ts
│       ├── routes/
│       │   └── index.ts                               # Mobile routes aggregator
│       └── config/
│           └── mobile-config.ts
│
├── shared/
│   ├── models/                  # Mongoose schemas (shared by both apps)
│   │   ├── User.model.ts
│   │   ├── Patient.model.ts
│   │   ├── Doctor.model.ts
│   │   ├── Hospital.model.ts
│   │   ├── Lab.model.ts
│   │   ├── Clinic.model.ts
│   │   ├── CollectionCenter.model.ts
│   │   ├── Case.model.ts
│   │   ├── Sample.model.ts
│   │   ├── SampleBatch.model.ts
│   │   ├── Report.model.ts
│   │   ├── ReportDocument.model.ts
│   │   ├── Test.model.ts
│   │   ├── TestSection.model.ts
│   │   ├── Appointment.model.ts
│   │   ├── AppointmentSlot.model.ts
│   │   ├── Invoice.model.ts
│   │   ├── Organization.model.ts
│   │   ├── Review.model.ts
│   │   └── index.ts             # Model exports
│   ├── services/                # Core business logic (shared)
│   │   ├── auth/
│   │   │   ├── AuthService.ts
│   │   │   ├── TokenService.ts
│   │   │   └── index.ts
│   │   ├── patients/
│   │   │   ├── PatientService.ts
│   │   │   └── index.ts
│   │   ├── facilities/
│   │   │   ├── HospitalService.ts
│   │   │   ├── LabService.ts
│   │   │   ├── ClinicService.ts
│   │   │   ├── CollectionCenterService.ts
│   │   │   └── index.ts
│   │   ├── cases/
│   │   │   ├── CaseService.ts
│   │   │   ├── CaseAttachmentService.ts
│   │   │   └── index.ts
│   │   ├── samples/
│   │   │   ├── SampleService.ts
│   │   │   ├── SampleBatchService.ts
│   │   │   ├── SampleTrackingService.ts
│   │   │   ├── SampleCustodyService.ts
│   │   │   └── index.ts
│   │   ├── reports/
│   │   │   ├── ReportService.ts
│   │   │   ├── ReportDocumentService.ts
│   │   │   ├── ReportProcessingService.ts
│   │   │   └── index.ts
│   │   ├── appointments/
│   │   │   ├── AppointmentService.ts
│   │   │   ├── SlotService.ts
│   │   │   ├── BookingService.ts
│   │   │   ├── OfferService.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   │   ├── TestService.ts
│   │   │   ├── TestCatalogService.ts
│   │   │   ├── TestPricingService.ts
│   │   │   ├── TestSectionService.ts
│   │   │   └── index.ts
│   │   ├── doctors/
│   │   │   ├── DoctorService.ts
│   │   │   ├── DoctorAssociationService.ts
│   │   │   ├── DoctorOrganizationService.ts
│   │   │   └── index.ts
│   │   ├── analytics/
│   │   │   ├── AnalyticsService.ts
│   │   │   ├── HealthInsightsService.ts
│   │   │   ├── TrendsService.ts
│   │   │   └── index.ts
│   │   ├── invoices/
│   │   │   ├── InvoiceService.ts
│   │   │   └── index.ts
│   │   ├── organizations/
│   │   │   ├── OrganizationService.ts
│   │   │   ├── ReviewService.ts
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── UserService.ts
│   │   │   └── index.ts
│   │   └── index.ts             # Service exports
│   ├── types/                   # Common TypeScript interfaces
│   │   ├── auth.types.ts
│   │   ├── patient.types.ts
│   │   ├── facility.types.ts
│   │   ├── case.types.ts
│   │   ├── sample.types.ts
│   │   ├── report.types.ts
│   │   ├── appointment.types.ts
│   │   ├── test.types.ts
│   │   ├── doctor.types.ts
│   │   ├── analytics.types.ts
│   │   ├── invoice.types.ts
│   │   ├── organization.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts             # Type exports
│   ├── validators/              # Base validation schemas
│   │   ├── base.validators.ts
│   │   ├── auth.validators.ts
│   │   ├── patient.validators.ts
│   │   ├── facility.validators.ts
│   │   ├── case.validators.ts
│   │   ├── sample.validators.ts
│   │   ├── report.validators.ts
│   │   ├── appointment.validators.ts
│   │   ├── test.validators.ts
│   │   ├── doctor.validators.ts
│   │   ├── analytics.validators.ts
│   │   ├── invoice.validators.ts
│   │   ├── organization.validators.ts
│   │   ├── user.validators.ts
│   │   └── index.ts
│   ├── utils/                   # Shared utilities
│   │   ├── database.utils.ts
│   │   ├── auth.utils.ts
│   │   ├── validation.utils.ts
│   │   ├── date.utils.ts
│   │   ├── file.utils.ts
│   │   ├── encryption.utils.ts
│   │   ├── email.utils.ts
│   │   ├── sms.utils.ts
│   │   ├── pdf.utils.ts
│   │   └── index.ts
│   ├── middleware/              # Common middleware
│   │   ├── error-handler.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── cors.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── roles.constants.ts
│   │   ├── status.constants.ts
│   │   ├── error-codes.constants.ts
│   │   ├── permissions.constants.ts
│   │   ├── api-versions.constants.ts
│   │   └── index.ts
│   └── enums/
│       ├── user-roles.enum.ts
│       ├── appointment-status.enum.ts
│       ├── case-status.enum.ts
│       ├── sample-status.enum.ts
│       ├── report-status.enum.ts
│       └── index.ts
│
├── plugins/                     # Fastify plugins
│   ├── database.plugin.ts
│   ├── auth.plugin.ts
│   ├── swagger.plugin.ts
│   ├── cors.plugin.ts
│   ├── rate-limit.plugin.ts
│   ├── compression.plugin.ts
│   ├── helmet.plugin.ts
│   └── index.ts
│
├── config/
│   ├── database.config.ts
│   ├── auth.config.ts
│   ├── app.config.ts
│   ├── swagger.config.ts
│   ├── cors.config.ts
│   └── index.ts
│
└── main.ts                      # Main entry point with app routing
```

## Key Differences Between Apps

### Web App (Healthcare Providers)
- **Full CRUD operations** on all entities
- **Administrative dashboards** for case management
- **Complex workflows** for lab processing
- **Multi-role authentication** (admin, lab technician, doctor)
- **Audit logging** and compliance features
- **Bulk operations** and reporting tools
- **Advanced analytics** and insights

### Mobile App (Patients/Consumers)
- **Read-only access** to personal data
- **Simple booking** and appointment management
- **View test results** and download reports
- **Basic profile management**
- **Notification preferences**
- **Find nearby facilities**
- **Personal health insights**

## Implementation Steps

### Phase 1: Setup New Structure
1. **Create directory structure**
   ```bash
   mkdir -p src/{apps/{web,mobile},shared/{models,services,types,validators,utils,middleware,constants,enums}}
   mkdir -p src/{plugins,config}
   ```

2. **Update tsconfig.json paths**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["src/*"],
         "@shared/*": ["src/shared/*"],
         "@web/*": ["src/apps/web/*"],
         "@mobile/*": ["src/apps/mobile/*"],
         "@plugins/*": ["src/plugins/*"],
         "@config/*": ["src/config/*"]
       }
     }
   }
   ```

### Phase 2: Extract Shared Components
1. **Move models** from `src/modules/*/models/` to `src/shared/models/`
2. **Extract services** from `src/modules/*/services/` to `src/shared/services/`
3. **Consolidate types** from `src/modules/*/types/` to `src/shared/types/`
4. **Move validators** from `src/modules/*/validators/` to `src/shared/validators/`

### Phase 3: Create App-Specific Controllers
1. **Web controllers** - Full administrative functionality
2. **Mobile controllers** - Simplified patient-focused operations
3. **Separate route definitions** for each app
4. **App-specific middleware** for authentication and authorization

### Phase 4: Configure Routing
1. **Main entry point** routes to apps based on URL prefix
2. **Web routes** under `/api/web/*`
3. **Mobile routes** under `/api/mobile/*`
4. **Shared API documentation** with separate sections

### Phase 5: Update Configurations
1. **Environment variables** for app-specific settings
2. **Separate middleware stacks** for each app
3. **Different authentication strategies** (admin vs patient)
4. **API rate limiting** based on app type

## Routing Strategy

### Main Router (main.ts)
```typescript
import { FastifyInstance } from 'fastify';
import webRoutes from './apps/web/routes';
import mobileRoutes from './apps/mobile/routes';

export default async function routes(fastify: FastifyInstance) {
  // Web app routes
  await fastify.register(webRoutes, { prefix: '/api/web' });
  
  // Mobile app routes  
  await fastify.register(mobileRoutes, { prefix: '/api/mobile' });
  
  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));
}
```

### Example Route Structure
```
/api/web/patients           # Full patient management for staff
/api/mobile/patients/me     # Patient's own profile only

/api/web/cases              # Full case management for staff
/api/mobile/cases           # NOT AVAILABLE (patients don't manage cases)

/api/web/reports            # All reports management
/api/mobile/reports/my      # Patient's own reports only

/api/web/facilities         # Full facility management
/api/mobile/facilities/search # Search nearby facilities only
```

## Benefits

### 1. **Clear Separation of Concerns**
- Web app handles complex healthcare provider workflows
- Mobile app provides simple patient-focused features
- No mixing of administrative and patient features

### 2. **Shared Foundation**
- Single source of truth for data models
- Consistent business logic across apps
- Shared utilities and common functionality

### 3. **Independent Scaling**
- Each app can evolve at its own pace
- Different performance requirements can be optimized
- Separate deployment strategies if needed in future

### 4. **Maintainable Architecture**
- Clear ownership boundaries for teams
- Easy to understand and navigate
- Consistent patterns within each app

### 5. **Security Benefits**
- Different authentication strategies
- Role-based access naturally separated
- Reduced attack surface per app type

### 6. **Future Flexibility**
- Easy to split into microservices later
- Can add more app types (e.g., partner API)
- Supports different API versions per app

## Configuration Updates

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts --fix",
    "dev:web": "tsx watch src/main.ts --env WEB_ONLY=true",
    "dev:mobile": "tsx watch src/main.ts --env MOBILE_ONLY=true"
  }
}
```

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/labloop

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Web App Specific
WEB_JWT_EXPIRES_IN=8h
WEB_RATE_LIMIT=1000

# Mobile App Specific  
MOBILE_JWT_EXPIRES_IN=30d
MOBILE_RATE_LIMIT=100

# Features
ENABLE_WEB_APP=true
ENABLE_MOBILE_APP=true
```

This structure provides a clear path forward while preserving your current architecture and allowing for gradual migration and independent development of web and mobile-focused features.