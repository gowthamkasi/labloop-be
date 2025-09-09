import { Address } from './User.interface.js';

export interface OrganizationContact {
  phone: string;
  email: string;
  website?: string;
  emergencyContact?: string;
}

export interface OrganizationOperatingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface OrganizationBranding {
  logo?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface OrganizationSettings {
  allowOnlineBooking: boolean;
  allowHomeCollection: boolean;
  maxDailyCapacity: number;
  averageReportTime: number;
  autoConfirmAppointments: boolean;
}

export interface OrganizationStats {
  totalPatients: number;
  totalTests: number;
  reviewCount: number;
  averageRating: number;
  completionRate: number;
}

export interface OrganizationSocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}

export interface Organization {
  _id: string;
  organizationId: string; // ORG000001 format
  name: string;
  type: 'hospital' | 'lab' | 'clinic' | 'collection_center' | 'diagnostic_center' | 'pharmacy' | 'other';
  licenseNumber: string;
  taxId?: string;
  contact: OrganizationContact;
  address: Address;
  operatingHours: OrganizationOperatingHours;
  branding?: OrganizationBranding;
  settings: OrganizationSettings;
  statistics: OrganizationStats;
  socialMedia?: OrganizationSocialMedia;
  services?: string[];
  specializations?: string[];
  amenities?: string[];
  
  // Network relationships
  parentOrganizationId?: string;
  affiliatedOrganizations?: string[];
  
  // Verification and status
  isVerified: boolean;
  verifiedAt?: Date;
  establishedDate?: Date;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
}