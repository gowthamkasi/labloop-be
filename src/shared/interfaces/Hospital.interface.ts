import { Address } from './User.interface.js';

export interface HospitalContact {
  phone: string;
  email?: string;
  website?: string;
  fax?: string;
}

export interface HospitalLicensing {
  licenseNumber: string;
  accreditation?: string;
  validUntil?: Date;
  issuingAuthority?: string;
}

export interface HospitalOperations {
  operatingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  emergencyServices: boolean;
  bedCapacity?: number;
  departments?: string[];
  specializations?: string[];
}

export interface HospitalSettings {
  allowOnlineBooking: boolean;
  allowWalkIns: boolean;
  maxDailyCapacity: number;
  averageWaitTime: number;
  autoConfirmAppointments: boolean;
}

export interface Hospital {
  _id: string;
  hospitalId: string; // HOS123456 format
  name: string;
  hospitalType: 'government' | 'private' | 'semi-government' | 'charitable';
  ownership: 'individual' | 'partnership' | 'corporation' | 'trust' | 'government';
  establishedDate?: Date;
  
  contact: HospitalContact;
  address: Address;
  licensing: HospitalLicensing;
  operations: HospitalOperations;
  settings: HospitalSettings;
  
  // Relationships
  attachedLabs?: string[];
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
  description?: string;
  galleryCount: number;
  
  // Operational stats
  totalPatients: number;
  totalDoctors: number;
  occupancyRate: number;
  
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