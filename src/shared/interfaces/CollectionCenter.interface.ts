import { Address } from './User.interface.js';

export interface CollectionCenterContact {
  phone: string;
  email?: string;
  whatsapp?: string;
}

export interface CollectionCenterOperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface CollectionCenterCapabilities {
  sampleTypes: string[];
  dailyCapacity: number;
  homeCollection: boolean;
  wheelchairAccessible: boolean;
  pediatricCollection: boolean;
}

export interface CollectionCenterStaff {
  phlebotomists: number;
  receptionist: boolean;
}

export interface CollectionCenterStatus {
  isActive: boolean;
  temporarilyClosed: boolean;
  closureReason?: string;
}

export interface CollectionCenter {
  _id: string;
  centerId: string; // COL000001 format
  centerType: 'standalone' | 'labAttached' | 'mobile' | 'kiosk';
  parentLab: string; // Required - Lab ID this collection center sends samples to
  name: string;
  registrationNumber: string;
  contact: CollectionCenterContact;
  address: Address & { landmark?: string };
  operatingHours: CollectionCenterOperatingHours;
  capabilities: CollectionCenterCapabilities;
  staff: CollectionCenterStaff;
  status: CollectionCenterStatus;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}