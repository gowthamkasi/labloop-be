# Module-by-Module Implementation Plan
## LabLoop Healthcare System - Schema Models & Module Development

This document outlines the comprehensive module-by-module implementation plan for the LabLoop healthcare system, following the apps-based architecture and existing code patterns.

## Implementation Strategy

### Architecture Overview
- **Shared Foundation**: Core models, services, and utilities used by both web and mobile apps
- **App-Specific Modules**: Domain modules with consistent organization per app
- **Clean Architecture**: Clear separation between controllers, services, and models
- **Healthcare Compliance**: HIPAA, HL7 FHIR, and GDPR compliant implementations

### Code Patterns to Follow
```typescript
// 1. Interface Definition Pattern (from User.interface.ts)
export interface EntityName {
  _id: string;
  entityId: string; // Auto-generated format like DOC123456
  // Core fields...
  
  // Audit fields (consistent across all entities)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
}

// 2. Model Schema Pattern (from User.model.ts)
const EntitySchema = new Schema<EntityMongoDoc>({
  entityId: { 
    type: String, 
    unique: true, 
    match: /^PREFIX\d{8}$/,
    required: true
  },
  // Fields...
  
  // Audit fields
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, sparse: true },
  isActive: { type: Boolean, default: true, index: true },
  version: { type: Number, default: 1 }
});

// 3. Pre-save Middleware Pattern
EntitySchema.pre('save', async function() {
  if (this.isNew && !this['entityId']) {
    this['entityId'] = await generateIdWithErrorHandling('PREFIX', 'EntityName', 'entityId');
  }
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
    this['version'] = (this['version'] || 0) + 1;
  }
});
```

## Module Implementation Phases

## Phase 1: Core Entity Models (Foundation) 

### 1.1 Doctor Module
**Location**: `src/shared/models/Doctor.model.ts`

```typescript
// Doctor Interface Structure
interface Doctor {
  _id: string;
  doctorId: string; // DOC000001 format
  registrationNumber: string; // Medical council registration
  personalInfo: {
    firstName: string;
    lastName: string;
    gender: Gender;
    dateOfBirth: Date;
    profilePhoto?: string;
  };
  qualifications: {
    primaryDegree: string; // MBBS, MD, etc.
    specializations: string[]; // Cardiology, Neurology, etc.
    additionalDegrees: string[];
    boardCertifications: string[];
    fellowships: string[];
  };
  experience: {
    totalYears: number;
    specialtyYears: number;
    currentSpecialty: string;
  };
  contact: ContactInfo;
  // Standard audit fields
}
```

**Module Structure**:
- `src/shared/interfaces/Doctor.interface.ts`
- `src/shared/models/Doctor.model.ts`
- `src/apps/web/modules/doctors/` (Full CRUD for admin)
- `src/apps/mobile/modules/doctors/` (Read-only for patients)

### 1.2 Organization Module
**Location**: `src/shared/models/Organization.model.ts`

```typescript
// Organization Interface Structure  
interface Organization {
  _id: string;
  organizationId: string; // ORG000001 format
  name: string;
  organizationType: 'hospital' | 'lab' | 'clinic' | 'collection_center' | 'network';
  licenseNumber: string;
  taxId?: string;
  contact: ContactInfo;
  address: Address;
  operatingHours: OperatingHours;
  branding: {
    logo?: string;
    tagline?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings: OrganizationSettings;
  parentNetwork?: string; // Reference to parent organization
  // Standard audit fields
}
```

### 1.3 Case Module  
**Location**: `src/shared/models/Case.model.ts`

```typescript
// Case Interface Structure
interface Case {
  _id: string;
  caseId: string; // CSE000001 format
  patientId: string; // Reference to Patient
  referringDoctorId?: string; // Reference to Doctor
  facilityId: string; // Lab/Hospital processing the case
  caseType: 'routine' | 'urgent' | 'stat' | 'reference';
  status: CaseStatus;
  testOrders: {
    testId: string;
    quantity: number;
    priority: 'routine' | 'urgent' | 'stat';
    clinicalHistory?: string;
  }[];
  sampleInfo: {
    sampleType: string;
    collectionDateTime: Date;
    collectedBy: string;
    collectionSite?: string;
  }[];
  workflow: {
    orderedAt: Date;
    collectedAt?: Date;
    processedAt?: Date;
    reportedAt?: Date;
    deliveredAt?: Date;
  };
  billing: {
    totalAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
    invoiceId?: string;
  };
  // Standard audit fields
}
```

## Phase 2: Facility Management Models

### 2.1 Clinic Module
**Location**: `src/shared/models/Clinic.model.ts`

```typescript
// Clinic Interface Structure
interface Clinic {
  _id: string;
  clinicId: string; // CLI000001 format
  name: string;
  clinicType: 'primary_care' | 'specialty' | 'urgent_care' | 'outpatient';
  licenseNumber: string;
  parentHospitalId?: string; // If attached to hospital
  contact: ContactInfo;
  address: Address;
  operatingHours: OperatingHours;
  specializations: string[]; // Cardiology, Dermatology, etc.
  services: string[]; // Consultation, Minor Surgery, etc.
  facilities: {
    consultationRooms: number;
    procedureRooms: number;
    waitingCapacity: number;
    parkingSpaces: number;
  };
  settings: FacilitySettings;
  mobileFields: MobileFacilityInfo;
  // Standard audit fields
}
```

### 2.2 Collection Center Module
**Location**: `src/shared/models/CollectionCenter.model.ts`

```typescript
// Collection Center Interface Structure
interface CollectionCenter {
  _id: string;
  collectionCenterId: string; // COL000001 format
  name: string;
  centerType: 'standalone' | 'lab_attached' | 'hospital_attached' | 'mobile';
  parentLabId?: string; // Reference to parent lab
  parentHospitalId?: string; // Reference to parent hospital
  contact: ContactInfo;
  address: Address;
  operatingHours: OperatingHours;
  capabilities: {
    sampleTypes: string[]; // Blood, Urine, Stool, etc.
    homeCollection: boolean;
    coldChain: boolean; // For samples requiring refrigeration
    storageCapacity: number;
  };
  equipment: string[]; // Centrifuge, Refrigerator, etc.
  staff: {
    phlebotomists: number;
    technicians: number;
    supervisors: number;
  };
  settings: FacilitySettings;
  mobileFields: MobileFacilityInfo;
  // Standard audit fields
}
```

### 2.3 Facility Relationship Models

#### DoctorFacilityAssociation Module
**Location**: `src/shared/models/DoctorFacilityAssociation.model.ts`

```typescript
// Doctor-Facility Association Interface
interface DoctorFacilityAssociation {
  _id: string;
  associationId: string; // DFA000001 format
  doctorId: string; // Reference to Doctor
  facilityId: string; // Reference to Hospital/Clinic/Lab
  facilityType: 'hospital' | 'clinic' | 'lab';
  associationType: 'employed' | 'consulting' | 'visiting' | 'affiliated';
  department?: string;
  designation?: string;
  schedule: {
    availableDays: string[]; // ['monday', 'tuesday', etc.]
    timeSlots: {
      startTime: string; // "09:00"
      endTime: string; // "17:00"
    }[];
  };
  permissions: {
    canOrderTests: boolean;
    canViewReports: boolean;
    canModifyCases: boolean;
  };
  status: 'active' | 'inactive' | 'suspended';
  validFrom: Date;
  validUntil?: Date;
  // Standard audit fields
}
```

#### FacilityRelationship Module
**Location**: `src/shared/models/FacilityRelationship.model.ts`

```typescript
// Facility-to-Facility Relationship Interface
interface FacilityRelationship {
  _id: string;
  relationshipId: string; // FRL000001 format
  primaryFacilityId: string; // Hospital/Clinic
  secondaryFacilityId: string; // Lab/Collection Center  
  primaryFacilityType: 'hospital' | 'clinic';
  secondaryFacilityType: 'lab' | 'collection_center';
  relationshipType: 'partnership' | 'outsourcing' | 'referral' | 'subsidiary';
  serviceTypes: string[]; // ['pathology', 'radiology', 'sample_collection']
  contractTerms: {
    startDate: Date;
    endDate?: Date;
    autoRenewal: boolean;
    discountPercentage?: number;
    minimumVolume?: number;
  };
  operationalSettings: {
    sampleTransport: boolean;
    digitalReports: boolean;
    priorityProcessing: boolean;
    dedicatedSupport: boolean;
  };
  status: 'active' | 'inactive' | 'expired' | 'terminated';
  // Standard audit fields
}
```

## Phase 3: Healthcare Operations Models

### 3.1 Test Module
**Location**: `src/shared/models/Test.model.ts`

```typescript
// Test Interface Structure
interface Test {
  _id: string;
  testId: string; // TST000001 format
  testCode: string; // Laboratory specific code (CBC, LFT, etc.)
  testName: string;
  alternateNames: string[]; // Common names/aliases
  testType: 'quantitative' | 'qualitative' | 'microscopic' | 'culture';
  category: string; // Hematology, Biochemistry, Microbiology, etc.
  sectionId: string; // Reference to TestSection
  sampleType: string[]; // Blood, Urine, Stool, etc.
  sampleVolume: {
    minimum: number; // in ml/units
    preferred: number;
    unit: string; // 'ml', 'units', 'drops'
  };
  methodology: string; // ELISA, PCR, etc.
  referenceRanges: {
    parameter: string;
    normalRange: {
      min?: number;
      max?: number;
      unit: string;
      ageGroup?: string; // 'adult', 'pediatric', etc.
      gender?: 'male' | 'female' | 'all';
    }[];
    criticalValues: {
      low?: number;
      high?: number;
      action: string;
    };
  }[];
  turnaroundTime: {
    routine: number; // in hours
    urgent: number;
    stat: number;
  };
  cost: {
    basePrice: number;
    currency: string;
    taxIncluded: boolean;
  };
  prerequisites: {
    fasting: boolean;
    fastingHours?: number;
    specialInstructions?: string[];
  };
  clinicalSignificance: string;
  limitations?: string[];
  interferenceFactors?: string[];
  status: 'active' | 'inactive' | 'deprecated';
  // Standard audit fields
}
```

### 3.2 Test Section Module
**Location**: `src/shared/models/TestSection.model.ts`

```typescript
// Test Section Interface Structure
interface TestSection {
  _id: string;
  sectionId: string; // SEC000001 format
  sectionName: string; // Hematology, Biochemistry, etc.
  sectionCode: string; // HEM, BCH, etc.
  description: string;
  parentSectionId?: string; // For sub-sections
  department: 'pathology' | 'radiology' | 'cardiology' | 'other';
  supervisor: {
    employeeId: string;
    name: string; // Denormalized for quick access
    qualifications: string[];
  };
  equipment: string[]; // Major equipment in this section
  testCategories: string[]; // Sub-categories within section
  qualityControls: {
    controlType: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    parameters: string[];
  }[];
  workingHours: {
    routine: OperatingHours;
    urgent: OperatingHours; // May differ from routine
    stat: string; // "24/7" or specific hours
  };
  certification: {
    nabh: boolean;
    nabl: boolean;
    cap: boolean;
    iso: boolean;
  };
  status: 'active' | 'inactive' | 'maintenance';
  // Standard audit fields
}
```

### 3.3 Sample Module
**Location**: `src/shared/models/Sample.model.ts`

```typescript
// Sample Interface Structure  
interface Sample {
  _id: string;
  sampleId: string; // SMP000001 format
  barcode: string; // Unique barcode for tracking
  caseId: string; // Reference to Case
  patientId: string; // Reference to Patient  
  collectionInfo: {
    collectedBy: string; // Staff member who collected
    collectionDateTime: Date;
    collectionSite: string; // Left arm, midstream, etc.
    collectionMethod: string; // Venipuncture, clean catch, etc.
    collectionCenter?: string; // If collected at external center
  };
  sampleDetails: {
    sampleType: string; // Blood, Urine, Stool, etc.
    volume: number;
    unit: string; // ml, units
    containers: string[]; // EDTA tube, Plain tube, etc.
    preservatives?: string[];
    appearance?: string; // Clear, turbid, hemolyzed, etc.
  };
  chainOfCustody: {
    handoverBy: string;
    receivedBy: string;
    handoverDateTime: Date;
    location: string;
    condition: 'good' | 'acceptable' | 'rejected';
    remarks?: string;
  }[];
  storage: {
    storageLocation: string; // Rack, Freezer, etc.
    storageCondition: string; // Room temperature, 2-8°C, etc.
    storedDateTime: Date;
    expiryDateTime?: Date;
  };
  processing: {
    processedBy?: string;
    processingDateTime?: Date;
    aliquots?: {
      aliquotId: string;
      volume: number;
      testAssigned: string;
    }[];
  };
  quality: {
    acceptanceStatus: 'accepted' | 'rejected' | 'conditional';
    rejectionReason?: string;
    qualityNotes?: string;
    hemolysis?: boolean;
    lipemic?: boolean;
    icteric?: boolean;
  };
  status: 'collected' | 'received' | 'processed' | 'analyzed' | 'discarded';
  // Standard audit fields
}
```

### 3.4 Report Module
**Location**: `src/shared/models/Report.model.ts`

```typescript
// Report Interface Structure
interface Report {
  _id: string;
  reportId: string; // RPT000001 format
  caseId: string; // Reference to Case
  patientId: string; // Reference to Patient
  facilityId: string; // Lab that generated report
  reportType: 'final' | 'preliminary' | 'amended' | 'corrected';
  reportTemplate: string; // Template used for generation
  
  patientInfo: {
    // Denormalized patient data for report generation
    name: string;
    age: number;
    gender: string;
    pid: string;
    address?: string;
  };
  
  clinicalInfo: {
    referringDoctor?: string;
    clinicalHistory?: string;
    diagnosis?: string;
    medications?: string[];
  };
  
  testResults: {
    testId: string;
    testName: string; // Denormalized
    results: {
      parameter: string;
      value: string;
      unit: string;
      normalRange: string;
      flag?: 'high' | 'low' | 'critical' | 'abnormal';
    }[];
    methodology?: string;
    comments?: string;
  }[];
  
  interpretation: {
    summary?: string;
    recommendations?: string[];
    clinicalCorrelation?: string;
    followUpRequired?: boolean;
    criticalValues?: string[];
  };
  
  validation: {
    reviewedBy: string; // Lab technician
    reviewedDateTime: Date;
    approvedBy?: string; // Pathologist/Supervisor  
    approvedDateTime?: Date;
    remarks?: string;
  };
  
  delivery: {
    deliveryMethod: 'digital' | 'physical' | 'both';
    deliveredDateTime?: Date;
    recipientInfo?: {
      recipientType: 'patient' | 'doctor' | 'facility';
      recipientId: string;
      deliveryNotes?: string;
    }[];
  };
  
  document: {
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    fileType: 'pdf' | 'html' | 'xml';
    digitalSignature?: string;
    watermark?: boolean;
  };
  
  status: 'draft' | 'reviewed' | 'approved' | 'delivered' | 'amended';
  version: number; // For amendments
  previousVersionId?: string; // Reference to previous version
  
  // Standard audit fields
}
```

## Phase 4: Appointment & Scheduling Models

### 4.1 Appointment Module
**Location**: `src/shared/models/Appointment.model.ts`

```typescript
// Appointment Interface Structure
interface Appointment {
  _id: string;
  appointmentId: string; // APT000001 format
  patientId: string; // Reference to Patient
  facilityId: string; // Hospital/Lab/Clinic
  facilityType: 'hospital' | 'lab' | 'clinic' | 'collection_center';
  doctorId?: string; // If appointment with specific doctor
  
  appointmentDetails: {
    appointmentType: 'consultation' | 'test_collection' | 'report_collection' | 'follow_up';
    serviceType: string; // Specific service/test
    appointmentDateTime: Date;
    estimatedDuration: number; // in minutes
    slotId?: string; // Reference to AppointmentSlot if applicable
  };
  
  patientInfo: {
    // Denormalized for quick access
    name: string;
    phone: string;
    email?: string;
    age: number;
    gender: string;
  };
  
  serviceDetails: {
    services: string[]; // Tests/Services requested
    specialRequirements?: string[];
    preparationInstructions?: string[];
    estimatedCost?: number;
  };
  
  booking: {
    bookedBy: 'patient' | 'staff' | 'doctor' | 'online';
    bookingDateTime: Date;
    bookingChannel: 'web' | 'mobile' | 'phone' | 'walk_in';
    bookingReference?: string;
    paymentStatus?: 'pending' | 'paid' | 'partial' | 'cancelled';
    paymentMethod?: string;
  };
  
  status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  
  workflow: {
    scheduledAt: Date;
    confirmedAt?: Date;
    checkedInAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
  };
  
  reminders: {
    sms: boolean;
    email: boolean;
    remindersSent: {
      type: 'sms' | 'email' | 'call';
      sentDateTime: Date;
      status: 'sent' | 'delivered' | 'failed';
    }[];
  };
  
  notes: {
    patientNotes?: string;
    staffNotes?: string;
    medicalNotes?: string;
  };
  
  // Standard audit fields
}
```

### 4.2 Appointment Slot Module
**Location**: `src/shared/models/AppointmentSlot.model.ts`

```typescript
// Appointment Slot Interface Structure
interface AppointmentSlot {
  _id: string;
  slotId: string; // SLT000001 format
  facilityId: string; // Hospital/Lab/Clinic
  facilityType: 'hospital' | 'lab' | 'clinic' | 'collection_center';
  doctorId?: string; // If doctor-specific slots
  serviceType: string; // consultation, blood_test, etc.
  
  slotDetails: {
    slotDate: Date;
    startTime: string; // "09:00"
    endTime: string; // "09:30"
    duration: number; // in minutes
    capacity: number; // How many patients can be booked
    bookedCount: number; // Current bookings
    slotType: 'regular' | 'emergency' | 'walk_in' | 'special';
  };
  
  availability: {
    isAvailable: boolean;
    unavailableReason?: string; // 'holiday', 'maintenance', 'doctor_unavailable'
    recurringPattern?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      daysOfWeek: string[]; // For weekly pattern
      endDate?: Date;
    };
  };
  
  restrictions: {
    minAdvanceBooking?: number; // hours
    maxAdvanceBooking?: number; // days
    cancellationDeadline?: number; // hours before appointment
    allowWalkIn: boolean;
    requiresPrePayment: boolean;
  };
  
  pricing: {
    basePrice?: number;
    specialPrice?: number; // For premium slots
    currency: string;
    discountApplicable?: boolean;
  };
  
  bookings: {
    appointmentId: string;
    patientName: string; // Denormalized
    patientPhone: string; // Denormalized  
    bookingTime: Date;
    status: 'confirmed' | 'cancelled';
  }[];
  
  status: 'active' | 'blocked' | 'cancelled' | 'completed';
  
  // Standard audit fields
}
```

## Phase 5: Business & Analytics Models

### 5.1 Invoice Module
**Location**: `src/shared/models/Invoice.model.ts`

```typescript
// Invoice Interface Structure
interface Invoice {
  _id: string;
  invoiceId: string; // INV000001 format
  invoiceNumber: string; // Human readable invoice number
  caseId?: string; // Reference to Case if test-related
  appointmentId?: string; // Reference to Appointment if consultation
  patientId: string; // Reference to Patient
  facilityId: string; // Billing facility
  
  billing: {
    billingType: 'test_services' | 'consultation' | 'package' | 'other';
    billingDate: Date;
    dueDate: Date;
    paymentTerms: string; // 'immediate', '30_days', etc.
  };
  
  patientInfo: {
    // Denormalized billing information
    name: string;
    phone: string;
    email?: string;
    address: Address;
    patientType: 'cash' | 'insurance' | 'corporate';
  };
  
  lineItems: {
    itemType: 'test' | 'consultation' | 'package' | 'misc';
    itemId: string; // Reference to Test/Service
    itemName: string; // Denormalized
    itemCode?: string;
    quantity: number;
    unitPrice: number;
    discount: {
      amount: number;
      percentage: number;
      reason?: string;
    };
    taxRate: number;
    totalAmount: number;
  }[];
  
  totals: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    finalAmount: number;
    currency: string;
  };
  
  payment: {
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    paymentMethod?: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'insurance';
    transactionId?: string;
    paymentDate?: Date;
    paymentNotes?: string;
  };
  
  insurance: {
    hasInsurance: boolean;
    insuranceProvider?: string;
    policyNumber?: string;
    claimAmount?: number;
    claimStatus?: 'pending' | 'approved' | 'rejected' | 'processed';
    claimId?: string;
  };
  
  delivery: {
    deliveryMethod: 'email' | 'sms' | 'physical' | 'patient_portal';
    deliveredDateTime?: Date;
    deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  };
  
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  
  // Standard audit fields
}
```

### 5.2 Lab Test Price Module  
**Location**: `src/shared/models/LabTestPrice.model.ts`

```typescript
// Lab Test Price Interface Structure
interface LabTestPrice {
  _id: string;
  priceId: string; // PRC000001 format
  facilityId: string; // Lab/Hospital offering the test
  testId: string; // Reference to Test
  
  testInfo: {
    // Denormalized test information
    testName: string;
    testCode: string;
    category: string;
    sampleType: string;
  };
  
  pricing: {
    basePrice: number;
    currency: string;
    priceType: 'individual' | 'package' | 'bulk';
    bulkDiscounts: {
      minQuantity: number;
      discountPercentage: number;
    }[];
  };
  
  categories: {
    patientCategory: 'general' | 'senior_citizen' | 'student' | 'employee' | 'vip';
    priceModifier: number; // Multiplier for base price
  }[];
  
  timing: {
    urgentSurcharge: number; // Additional cost for urgent processing
    statSurcharge: number; // Additional cost for STAT processing
    weekendSurcharge?: number;
    holidaySurcharge?: number;
  };
  
  validity: {
    effectiveFrom: Date;
    effectiveUntil?: Date;
    isActive: boolean;
  };
  
  location: {
    // If price varies by collection location
    homeCollection: {
      available: boolean;
      additionalCharge: number;
    };
    facilityCollection: {
      available: boolean;
      discount?: number;
    };
  };
  
  insurance: {
    insuranceCovered: boolean;
    approvedInsurers: string[];
    reimbursementRate?: number;
  };
  
  competition: {
    // Market analysis fields
    marketPrice?: number;
    competitorPrices: {
      competitorName: string;
      price: number;
      source: string;
      updatedDate: Date;
    }[];
  };
  
  // Standard audit fields
}
```

### 5.3 Organization Review Module
**Location**: `src/shared/models/OrganizationReview.model.ts`

```typescript
// Organization Review Interface Structure
interface OrganizationReview {
  _id: string;
  reviewId: string; // REV000001 format
  organizationId: string; // Reference to Hospital/Lab/Clinic
  organizationType: 'hospital' | 'lab' | 'clinic' | 'collection_center';
  patientId?: string; // Reference to Patient (if registered user)
  
  reviewerInfo: {
    // May be anonymous or registered patient
    name?: string;
    email?: string;
    phone?: string;
    isVerifiedPatient: boolean;
    isAnonymous: boolean;
  };
  
  reviewContent: {
    overallRating: number; // 1-5 stars
    aspectRatings: {
      staffBehavior?: number;
      cleanliness?: number;
      reportAccuracy?: number;
      timeliness?: number;
      facilities?: number;
      costValue?: number;
    };
    title: string;
    description: string;
    positivePoints?: string[];
    negativePoints?: string[];
    wouldRecommend: boolean;
  };
  
  serviceDetails: {
    serviceType: string; // Test type, consultation type, etc.
    serviceDate: Date;
    appointmentId?: string; // If related to specific appointment
    caseId?: string; // If related to specific case
    visitType: 'first_time' | 'returning';
  };
  
  verification: {
    isVerified: boolean;
    verificationMethod?: 'appointment_confirmation' | 'invoice_verification' | 'manual';
    verifiedBy?: string; // Staff member who verified
    verifiedDateTime?: Date;
  };
  
  response: {
    // Organization's response to review
    hasResponse: boolean;
    responseText?: string;
    responseBy?: string; // Staff member
    responseDateTime?: Date;
  };
  
  moderation: {
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    moderatedBy?: string;
    moderationDateTime?: Date;
    moderationReason?: string;
    flaggedReasons?: string[]; // spam, inappropriate, etc.
  };
  
  helpfulness: {
    helpfulCount: number;
    notHelpfulCount: number;
    reportedCount: number;
  };
  
  // Standard audit fields
}
```

## Implementation Guidelines

### Shared Model Patterns
1. **ID Generation**: All entities use auto-generated IDs with specific prefixes
2. **Audit Fields**: Consistent createdAt, updatedAt, deletedAt, version tracking
3. **Soft Delete**: Use deletedAt and isActive fields instead of hard deletes
4. **Validation**: Strict validation rules using Zod schemas
5. **Indexing**: Proper MongoDB indexes for query performance
6. **References**: Use ObjectId references with denormalized critical data

### Module Structure per App
```
src/apps/[web|mobile]/modules/[module_name]/
├── controllers/          # Request handlers
├── routes/              # Route definitions  
├── validators/          # Request validation schemas
├── types/              # App-specific types
└── middleware/         # Module-specific middleware
```

### Development Sequence
1. **Week 1-2**: Core Entity Models (Doctor, Organization, Case)  
2. **Week 3-4**: Facility Models (Clinic, CollectionCenter, Relationships)
3. **Week 5-6**: Healthcare Operations (Test, TestSection, Sample, Report)
4. **Week 7-8**: Appointment & Scheduling (Appointment, AppointmentSlot)
5. **Week 9-10**: Business Models (Invoice, LabTestPrice, OrganizationReview)
6. **Week 11-12**: Module Integration, Testing, and Documentation

### Testing Strategy
- Unit tests for each model's validation and methods
- Integration tests for model relationships
- Performance tests for complex queries
- Compliance tests for healthcare regulations

This plan ensures systematic development of a comprehensive healthcare management system following established patterns and maintaining code quality standards.