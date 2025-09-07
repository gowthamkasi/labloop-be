/**
 * Hospital Repository Interface for LabLoop Healthcare System
 * Handles hospital facilities with attached labs and departments
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IHospital, HospitalType } from '../../types/index.js';

export interface IHospitalRepository extends IBaseRepository<IHospital> {
  // Basic hospital identification
  findByHospitalId(hospitalId: string): Promise<IHospital | null>;
  
  // Search and filtering
  findByType(hospitalType: HospitalType): Promise<IHospital[]>;
  findByAccreditation(accreditation: keyof IHospital['accreditation']): Promise<IHospital[]>;
  findByDepartment(department: string): Promise<IHospital[]>;
  
  // Location-based queries
  findNearby(coordinates: [number, number], maxDistance: number): Promise<IHospital[]>;
  findByCity(city: string): Promise<IHospital[]>;
  findByState(state: string): Promise<IHospital[]>;
  
  // Advanced search
  searchHospitals(query: {
    searchTerm?: string;
    hospitalType?: HospitalType;
    accreditations?: string[];
    city?: string;
    state?: string;
    departments?: string[];
    isActive?: boolean;
  }): Promise<IHospital[]>;
  
  // Statistics
  getHospitalStats(): Promise<{
    total: number;
    byType: Record<HospitalType, number>;
    byAccreditation: Record<string, number>;
    averageDepartments: number;
  }>;
}