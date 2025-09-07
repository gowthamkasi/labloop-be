/**
 * Lab Repository Interface for LabLoop Healthcare System
 * Handles laboratory facilities with collection centers and capabilities
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { ILab } from '../../types/index.js';

export interface ILabRepository extends IBaseRepository<ILab> {
  // Basic lab identification
  findByLabId(labId: string): Promise<ILab | null>;
  
  // Search and filtering methods will be added based on the complete schema
  findByCapability(capability: string): Promise<ILab[]>;
  findByAccreditation(accreditation: string): Promise<ILab[]>;
  
  // Location-based queries
  findNearby(coordinates: [number, number], maxDistance: number): Promise<ILab[]>;
  findByCity(city: string): Promise<ILab[]>;
  
  // Statistics
  getLabStats(): Promise<{
    total: number;
    active: number;
    byCapability: Record<string, number>;
  }>;
}