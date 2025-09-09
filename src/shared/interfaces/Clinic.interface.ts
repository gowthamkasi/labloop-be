import { Address } from './User.interface.js';

export interface ClinicContact {
  phone: string;
  email: string;
  website?: string;
  emergencyNumber?: string;
}

export interface ClinicOperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface ClinicFacilities {
  consultationRooms: number;
  pharmacy: boolean;
  minorProcedures: boolean;
  vaccination: boolean;
  diagnostics: boolean;
}

export interface ClinicStatus {
  isActive: boolean;
  isVerified: boolean;
}

export interface Clinic {
  _id: string;
  clinicId: string; // CLN000001 format
  clinicType: 'general' | 'specialty' | 'polyclinic' | 'daycare' | 'urgent';
  specialties: string[];
  name: string;
  licenseNumber: string;
  taxId?: string;
  contact: ClinicContact;
  address: Address;
  operatingHours: ClinicOperatingHours;
  facilities: ClinicFacilities;
  preferredLabs?: string[]; // Array of lab IDs this clinic refers patients to
  status: ClinicStatus;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}