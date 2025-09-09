import { Address } from './User.interface.js';

export interface LabContact {
  phone: string;
  email?: string;
  website?: string;
  fax?: string;
}

export interface LabLicensing {
  licenseNumber: string;
  nabl?: string;
  iso?: string;
  cap?: string;
  validUntil?: Date;
}

export interface LabCapabilities {
  testingCapabilities: string[];
  equipmentList?: string[];
  certifiedTechnicians: number;
  qualityControlMeasures?: string[];
  turnaroundTime: number; // hours
  sampleTypes: string[];
}

export interface LabOperations {
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  homeCollection: boolean;
  emergencyServices: boolean;
  reportDeliveryMethods: string[];
  sampleStorageCapacity: number;
}

export interface LabSettings {
  allowOnlineBooking: boolean;
  allowHomeCollection: boolean;
  maxDailyCapacity: number;
  averageReportTime: number;
  autoConfirmAppointments: boolean;
  digitalReports: boolean;
}

export interface Lab {
  _id: string;
  labId: string; // LAB123456 format
  name: string;
  labType: 'pathology' | 'radiology' | 'clinical' | 'molecular' | 'microbiology' | 'hematology' | 'biochemistry';
  ownership: 'individual' | 'partnership' | 'corporation' | 'hospital-owned' | 'chain';
  establishedDate?: Date;
  
  contact: LabContact;
  address: Address;
  licensing: LabLicensing;
  capabilities: LabCapabilities;
  operations: LabOperations;
  settings: LabSettings;
  
  // Relationships
  parentHospital?: string;
  attachedCollectionCenters?: string[];
  parentNetwork?: string;
  
  // Mobile app fields
  reviewCount: number;
  averageRating: number;
  priceRange: '$' | '$$' | '$$$';
  features: string[];
  services: string[];
  amenities: string[];
  thumbnail?: string;
  acceptsInsurance: boolean;
  labDescription?: string;
  galleryCount: number;
  
  // Operational stats
  totalTests: number;
  totalPatients: number;
  completionRate: number;
  sameDayResults: boolean;
  onlineReports: boolean;
  
  // Branding
  logo?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  
  // Social media
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}