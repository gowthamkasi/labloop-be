import { Gender } from '../types/enums.js';

export interface DoctorPersonalInfo {
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: Date;
  profilePhoto?: string;
}

export interface DoctorQualifications {
  primaryDegree: string;
  specializations?: string[];
  additionalDegrees?: string[];
  boardCertifications?: string[];
  fellowships?: string[];
}

export interface DoctorExperience {
  totalYears?: number;
  specialtyYears?: number;
  currentSpecialty?: string;
}

export interface DoctorContact {
  mobile: string;
  email: string;
  alternatePhone?: string;
}

export interface Doctor {
  _id: string;
  doctorId: string; // DOC000001 format
  registrationNumber: string; // Medical registration number
  personalInfo: DoctorPersonalInfo;
  qualifications: DoctorQualifications;
  experience?: DoctorExperience;
  contact: DoctorContact;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  isActive: boolean;
  version: number;
}