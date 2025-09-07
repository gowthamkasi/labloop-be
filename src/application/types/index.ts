/**
 * TypeScript Interfaces and Types for LabLoop Healthcare System
 * Comprehensive type definitions for all domain models
 */

import { Document, Types } from 'mongoose';

// ====================== ENUMS AND CONSTANTS ======================

export type UserType = 'b2b' | 'b2c';
export type UserRole = 'admin' | 'labManager' | 'technician' | 'collectionAgent' | 'receptionist' | 'qualityController' | 'labAssistant' | 'consumer' | 'familyManager';
export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
export type PatientStatus = 'active' | 'inactive' | 'deceased';
export type ReferralType = 'hospital' | 'lab' | 'doctor' | 'collectionCenter' | 'clinic';

// ====================== BASE INTERFACES ======================

export interface IBaseDocument extends Document {
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  };
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface IContact {
  mobileNumber: string;
  alternateNumber?: string;
  email?: string;
  address?: IAddress;
}

// ====================== USER MODEL ======================

export interface IUserProfile {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: Gender;
  mobileNumber?: string;
  profilePicture?: string;
  address?: IAddress;
}

export interface IEmployment {
  organizationId?: Types.ObjectId;
  designation?: string;
  department?: string;
  joiningDate?: Date;
  reportingTo?: Types.ObjectId;
}

export interface IHealthProfile {
  height?: number;
  weight?: number;
  bloodGroup?: BloodGroup;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface IUserPermissions {
  canCreateCases: boolean;
  canEditCases: boolean;
  canDeleteCases: boolean;
  canCreateReports: boolean;
  canApproveReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageInventory: boolean;
}

export interface IAuthentication {
  twoFactorEnabled: boolean;
  loginAttempts: number;
  lockedUntil?: Date;
  lastLogin?: Date;
  refreshToken?: string;
}

export interface IUserStatus {
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface IUserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface IUser extends IBaseDocument {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  userType: UserType;
  role: UserRole;
  managedPatients?: Types.ObjectId[];
  profile: IUserProfile;
  employment?: IEmployment;
  healthProfile?: IHealthProfile;
  permissions: IUserPermissions;
  authentication: IAuthentication;
  status: IUserStatus;
  preferences: IUserPreferences;
}

// ====================== PATIENT MODEL ======================

export interface IPatientDemographics {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
}

export interface IPatientContact {
  mobileNumber: string;
  alternateNumber?: string;
  email?: string;
  address?: IAddress;
}

export interface IMedicalHistory {
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  surgeries?: string[];
  familyHistory?: Record<string, any>;
}

export interface IInsurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  validUntil?: Date;
}

export interface IReferralChain {
  referralId: string;
  referredBy: Types.ObjectId;
  referredByType: ReferralType;
  referredByName: string;
  referredTo?: Types.ObjectId;
  referredToType?: ReferralType;
  referralDate: Date;
  referralReason?: string;
  referralNotes?: string;
  referralTests?: Types.ObjectId[];
  isActive: boolean;
  completedDate?: Date;
}

export interface ICurrentReferralSource {
  referredBy?: Types.ObjectId;
  referredByType?: ReferralType;
  referredByName?: string;
  referralDate?: Date;
}

export interface IPatientConsent {
  dataSharing: boolean;
  researchParticipation: boolean;
  marketingCommunication: boolean;
  familyAccessConsent: boolean;
  consentDate?: Date;
}

export interface IPatientStatistics {
  totalCases: number;
  totalReports: number;
  lastVisit?: Date;
}

export interface IPatient extends IBaseDocument {
  patientId: string;
  mrn?: string;
  primaryUserId?: Types.ObjectId;
  authorizedUsers?: Types.ObjectId[];
  linkedConsumerAccount?: Types.ObjectId;
  demographics: IPatientDemographics;
  contact: IPatientContact;
  medicalHistory?: IMedicalHistory;
  insurance?: IInsurance;
  referralChain?: IReferralChain[];
  currentReferralSource?: ICurrentReferralSource;
  consent: IPatientConsent;
  statistics: IPatientStatistics;
  status: PatientStatus;
}

// ====================== HOSPITAL MODEL ======================

export type HospitalType = 'general' | 'specialty' | 'multiSpecialty' | 'teaching' | 'research';
export type PriceRange = '$' | '$$' | '$$$';

export interface IAccreditation {
  nabh: boolean;
  nabl: boolean;
  jci: boolean;
  iso: boolean;
}

export interface IHospitalContact {
  phone: string;
  email: string;
  website?: string;
  emergencyContact?: string;
}

export interface IOperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface IHospitalCapabilities {
  services?: string[];
  specializations?: string[];
  equipment?: string[];
  certificationsCount: number;
  activeCertifications?: Record<string, any>[];
}

export interface IHospitalSettings {
  allowOnlineBooking: boolean;
  allowHomeCollection: boolean;
  maxDailyCapacity: number;
  averageReportTime: number;
  autoConfirmAppointments: boolean;
}

export interface IBranding {
  logo?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface IMobileFields {
  reviewCount: number;
  averageRating: number;
  priceRange: PriceRange;
  features: string[];
  services: string[];
  amenities: string[];
  thumbnail?: string;
  acceptsInsurance: boolean;
  averageWaitTime: number;
  hospitalDescription?: string;
  galleryCount: number;
}

export interface IHospitalStatus {
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface IHospital extends IBaseDocument {
  hospitalId: string;
  hospitalType: HospitalType;
  accreditation: IAccreditation;
  departments?: string[];
  bedCapacity?: number;
  icuBeds?: number;
  emergencyServices: boolean;
  attachedLabs?: Types.ObjectId[];
  name: string;
  licenseNumber: string;
  taxId?: string;
  contact: IHospitalContact;
  address: IAddress & { coordinates?: { type: 'Point'; coordinates: [number, number] } };
  operatingHours: IOperatingHours;
  capabilities: IHospitalCapabilities;
  settings: IHospitalSettings;
  branding?: IBranding;
  mobileFields: IMobileFields;
  status: IHospitalStatus;
}

// ====================== LAB MODEL ======================

export type LabType = 'diagnostic' | 'pathology' | 'radiology' | 'combined' | 'specialized';
export type LabOwnership = 'independent' | 'hospitalAttached' | 'chain' | 'franchise';

export interface ILabCapabilities {
  testCategories?: string[];
  specializations?: string[];
  equipment?: string[];
  dailyCapacity: number;
  homeCollection: boolean;
  emergencyServices: boolean;
}

export interface ILabOperationalStats {
  sameDay: boolean;
  homeCollection: boolean;
  onlineReports: boolean;
  totalTests: number;
  totalPatients: number;
  completionRate: number;
}

export interface ISocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface ILabStatus {
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface ILab extends IBaseDocument {
  labId: string;
  labType: LabType;
  ownership: LabOwnership;
  parentHospital?: Types.ObjectId;
  attachedCollectionCenters?: Types.ObjectId[];
  name: string;
  licenseNumber: string;
  nablAccreditationNumber?: string;
  capAccreditationNumber?: string;
  taxId?: string;
  contact: IHospitalContact;
  address: IAddress & { coordinates?: { type: 'Point'; coordinates: [number, number] } };
  operatingHours: IOperatingHours;
  capabilities: ILabCapabilities;
  settings: IHospitalSettings;
  branding?: IBranding;
  mobileFields: IMobileFields & { labDescription?: string };
  operationalStats: ILabOperationalStats;
  socialMedia?: ISocialMedia;
  parentNetwork?: Types.ObjectId;
  status: ILabStatus;
  establishedDate?: Date;
}

// ====================== TEST MODEL ======================

export type TestCategory = 'biochemistry' | 'hematology' | 'microbiology' | 'immunology' | 'genetics' | 'pathology' | 'radiology';
export type TestStatus = 'active' | 'discontinued' | 'comingSoon' | 'seasonal';
export type SampleType = 'blood' | 'urine' | 'stool' | 'sputum' | 'tissue' | 'csf' | 'other';
export type TestComplexity = 'basic' | 'intermediate' | 'advanced' | 'specialized';

export interface ITestParameter {
  parameterName: string;
  unit?: string;
  referenceRange?: {
    min?: number;
    max?: number;
    qualitative?: string[];
  };
  criticalRange?: {
    low?: number;
    high?: number;
  };
}

export interface ITestPricing {
  basePrice: number;
  homeCollectionPrice?: number;
  urgentPrice?: number;
  discountedPrice?: number;
  insuranceCovered: boolean;
}

export interface ITestRequirements {
  fastingRequired: boolean;
  fastingHours?: number;
  specialInstructions?: string[];
  sampleVolume?: string;
  sampleContainer?: string;
  storageConditions?: string;
}

export interface ITestTimings {
  normalReportTime: number; // hours
  urgentReportTime?: number; // hours
  processingDays?: string[];
  processingHours?: {
    start: string;
    end: string;
  };
}

export interface ITest extends IBaseDocument {
  testId: string;
  testCode: string;
  name: string;
  description?: string;
  shortName?: string;
  category: TestCategory;
  subCategory?: string;
  complexity: TestComplexity;
  sampleType: SampleType[];
  parameters: ITestParameter[];
  methodology?: string;
  department?: string;
  pricing: ITestPricing;
  requirements: ITestRequirements;
  timings: ITestTimings;
  relatedTests?: Types.ObjectId[];
  tags?: string[];
  keywords?: string[];
  isPopular: boolean;
  isRoutine: boolean;
  status: TestStatus;
  minimumAge?: number;
  maximumAge?: number;
  genderSpecific?: 'male' | 'female' | 'both';
  clinicalSignificance?: string;
  limitations?: string[];
}

// ====================== CASE MODEL ======================

export type CaseStatus = 'draft' | 'confirmed' | 'sampleCollected' | 'inProgress' | 'completed' | 'cancelled' | 'onHold';
export type CasePriority = 'routine' | 'urgent' | 'stat' | 'critical';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'cancelled';

export interface ICasePatient {
  patientId: Types.ObjectId;
  name: string;
  age: number;
  gender: Gender;
  contact: string;
}

export interface ICasePhysician {
  physicianId?: Types.ObjectId;
  name: string;
  contact?: string;
  licenseNumber?: string;
  specialization?: string;
}

export interface ICaseBilling {
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  advanceAmount?: number;
  balanceAmount?: number;
  paymentMode?: string;
  invoiceNumber?: string;
  paymentStatus: PaymentStatus;
}

export interface ICaseWorkflow {
  currentStage: CaseStatus;
  stages: {
    stage: CaseStatus;
    timestamp: Date;
    completedBy?: Types.ObjectId;
    notes?: string;
  }[];
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

export interface ICase extends IBaseDocument {
  caseId: string;
  caseNumber?: string;
  patient: ICasePatient;
  physician?: ICasePhysician;
  labId: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  testIds: Types.ObjectId[];
  sampleIds?: Types.ObjectId[];
  appointmentId?: Types.ObjectId;
  reportIds?: Types.ObjectId[];
  priority: CasePriority;
  status: CaseStatus;
  workflow: ICaseWorkflow;
  billing: ICaseBilling;
  clinicalHistory?: string;
  provisionalDiagnosis?: string;
  specialInstructions?: string;
  internalNotes?: string;
  collectionDate?: Date;
  expectedReportDate?: Date;
  tags?: string[];
}

// ====================== SAMPLE MODEL ======================

export type SampleStatus = 'collected' | 'inTransit' | 'received' | 'processing' | 'completed' | 'rejected' | 'insufficient';
export type RejectionReason = 'insufficient' | 'hemolyzed' | 'clotted' | 'contaminated' | 'expired' | 'improperStorage' | 'other';

export interface ISampleChainOfCustody {
  timestamp: Date;
  stage: 'collection' | 'transit' | 'receipt' | 'storage' | 'processing' | 'disposal';
  handledBy: Types.ObjectId;
  location: string;
  temperature?: number;
  notes?: string;
}

export interface ISampleQuality {
  volume?: string;
  appearance?: string;
  integrity: 'good' | 'acceptable' | 'poor';
  temperature?: number;
  ph?: number;
  notes?: string;
}

export interface ISampleRejection {
  isRejected: boolean;
  reason?: RejectionReason;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  description?: string;
  photos?: string[];
}

export interface ISample extends IBaseDocument {
  sampleId: string;
  barcode?: string;
  caseId: Types.ObjectId;
  patientId: Types.ObjectId;
  testIds: Types.ObjectId[];
  sampleType: SampleType;
  containerType?: string;
  volume?: string;
  priority: CasePriority;
  status: SampleStatus;
  collectedAt: Date;
  collectedBy: Types.ObjectId;
  collectionLocation?: string;
  receivedAt?: Date;
  receivedBy?: Types.ObjectId;
  quality: ISampleQuality;
  chainOfCustody: ISampleChainOfCustody[];
  rejection?: ISampleRejection;
  storageLocation?: string;
  storageConditions?: string;
  expiryDate?: Date;
  labId: Types.ObjectId;
  specialHandling?: string[];
  preservatives?: string[];
  notes?: string;
}

// ====================== REPORT MODEL ======================

export type ReportStatus = 'draft' | 'inReview' | 'approved' | 'published' | 'cancelled' | 'amended';
export type ReportType = 'preliminary' | 'final' | 'amended' | 'supplementary';
export type CriticalFlag = 'low' | 'high' | 'critical' | 'panic';

export interface ITestResult {
  testId: Types.ObjectId;
  sampleId: Types.ObjectId;
  parameterName: string;
  value?: string | number;
  unit?: string;
  referenceRange?: string;
  flag?: CriticalFlag;
  abnormal: boolean;
  comments?: string;
  methodology?: string;
}

export interface IReportApproval {
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  approverName?: string;
  approverDesignation?: string;
  digitalSignature?: string;
}

export interface IReportDistribution {
  sentTo: {
    recipient: 'patient' | 'physician' | 'hospital';
    recipientId: Types.ObjectId;
    method: 'email' | 'sms' | 'print' | 'portal';
    sentAt: Date;
    status: 'sent' | 'delivered' | 'read' | 'failed';
  }[];
}

export interface IReportVersioning {
  version: string;
  isLatest: boolean;
  previousVersions?: Types.ObjectId[];
  amendments?: {
    amendmentReason: string;
    amendedBy: Types.ObjectId;
    amendedAt: Date;
    changesDescription: string;
  }[];
}

export interface IReport extends IBaseDocument {
  reportId: string;
  reportNumber?: string;
  caseId: Types.ObjectId;
  patientId: Types.ObjectId;
  labId: Types.ObjectId;
  reportType: ReportType;
  status: ReportStatus;
  testResults: ITestResult[];
  overallInterpretation?: string;
  clinicalCorrelation?: string;
  recommendations?: string[];
  criticalValues?: ITestResult[];
  technicalComments?: string;
  generatedAt: Date;
  generatedBy: Types.ObjectId;
  approval: IReportApproval;
  versioning: IReportVersioning;
  distribution?: IReportDistribution;
  pdfPath?: string;
  isConfidential: boolean;
  customFields?: Record<string, any>;
  qualityFlags?: string[];
}

// ====================== INVOICE MODEL ======================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netBanking' | 'wallet' | 'insurance' | 'credit';

export interface IInvoiceLineItem {
  itemType: 'test' | 'package' | 'homeCollection' | 'discount' | 'tax' | 'other';
  itemId?: Types.ObjectId;
  itemName: string;
  itemCode?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
}

export interface IInvoiceTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface IPaymentTransaction {
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paidAt: Date;
  paidBy?: string;
  reference?: string;
  gateway?: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  notes?: string;
}

export interface IInvoiceDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
  approvedBy?: Types.ObjectId;
  couponCode?: string;
  applicableTests?: Types.ObjectId[];
}

export interface ITaxBreakdown {
  taxName: string;
  taxType: 'percentage' | 'fixed';
  taxRate: number;
  taxAmount: number;
  applicableAmount: number;
}

export interface IInvoice extends IBaseDocument {
  invoiceId: string;
  invoiceNumber: string;
  caseId?: Types.ObjectId;
  patientId: Types.ObjectId;
  labId: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  billingAddress: IAddress;
  lineItems: IInvoiceLineItem[];
  totals: IInvoiceTotals;
  discounts?: IInvoiceDiscount[];
  taxes?: ITaxBreakdown[];
  paymentTransactions?: IPaymentTransaction[];
  status: InvoiceStatus;
  issueDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  internalNotes?: string;
  paymentTerms?: string;
  issuedBy: Types.ObjectId;
  customerGstin?: string;
  placeOfSupply?: string;
}

// ====================== APPOINTMENT MODEL ======================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'checkedIn' | 'inProgress' | 'completed' | 'cancelled' | 'noShow' | 'rescheduled';
export type AppointmentType = 'sampleCollection' | 'consultation' | 'reportDelivery' | 'followUp';
export type AppointmentSlotStatus = 'available' | 'booked' | 'blocked' | 'unavailable';

export interface IAppointmentSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  status: AppointmentSlotStatus;
  maxCapacity?: number;
  currentBookings?: number;
}

export interface IAppointmentDetails {
  appointmentId: Types.ObjectId;
  testId: Types.ObjectId;
  testName: string;
  sampleType?: SampleType;
  specialInstructions?: string[];
  estimatedDuration?: number;
}

export interface IAppointmentLocation {
  type: 'lab' | 'hospital' | 'collectionCenter' | 'home';
  locationId: Types.ObjectId;
  locationName: string;
  address?: IAddress;
  contactPerson?: {
    name: string;
    phone: string;
  };
}

export interface IAppointmentCancellation {
  cancelledBy: Types.ObjectId;
  cancelledAt: Date;
  reason: string;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'declined';
}

export interface IAppointmentReschedule {
  rescheduledBy: Types.ObjectId;
  rescheduledAt: Date;
  originalSlot: IAppointmentSlot;
  newSlot: IAppointmentSlot;
  reason?: string;
}

export interface IAppointment extends IBaseDocument {
  appointmentId: string;
  appointmentNumber?: string;
  caseId?: Types.ObjectId;
  patientId: Types.ObjectId;
  patientName: string;
  patientPhone: string;
  labId?: Types.ObjectId;
  hospitalId?: Types.ObjectId;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  priority: CasePriority;
  slot: IAppointmentSlot;
  location: IAppointmentLocation;
  testDetails: IAppointmentDetails[];
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: PaymentStatus;
  specialRequests?: string;
  patientNotes?: string;
  internalNotes?: string;
  assignedStaff?: Types.ObjectId;
  checkedInAt?: Date;
  completedAt?: Date;
  cancellation?: IAppointmentCancellation;
  reschedule?: IAppointmentReschedule;
  remindersSent?: Date[];
  followUpRequired?: boolean;
  rating?: number;
  feedback?: string;
}

// ====================== AUDIT TRAIL ======================

export interface IAuditTrail extends Document {
  action: 'create' | 'update' | 'delete' | 'read';
  documentId: string | Types.ObjectId;
  collection: string;
  userId?: string | Types.ObjectId;
  timestamp: Date;
  changes?: {
    old?: Record<string, any>;
    new?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

// ====================== PAGINATION AND QUERY INTERFACES ======================

export interface IPaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ISearchQuery {
  searchTerm?: string;
  filters?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  populate?: string[];
}

// ====================== API RESPONSE INTERFACES ======================

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: IPaginatedResult<any>['pagination'];
    timestamp: Date;
    version: string;
  };
}

// ====================== ERROR INTERFACES ======================

export interface IAppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: Record<string, any>;
}

// Export commonly used types for convenience
export type MongoId = string | Types.ObjectId;
export type OptionalId<T> = Omit<T, '_id'> & { _id?: Types.ObjectId };
export type CreateInput<T> = Omit<T, keyof IBaseDocument | '_id'>;
export type UpdateInput<T> = Partial<Omit<T, keyof IBaseDocument | '_id'>>;