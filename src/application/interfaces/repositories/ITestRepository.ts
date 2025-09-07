/**
 * Test Repository Interface for LabLoop Healthcare System
 * Handles test catalog with parameters, pricing, and categories
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { ITest } from '../../types/index.js';

export interface ITestRepository extends IBaseRepository<ITest> {
  // Basic test identification
  findByTestId(testId: string): Promise<ITest | null>;
  findByCode(testCode: string): Promise<ITest | null>;
  
  // Search and filtering
  findByCategory(category: string): Promise<ITest[]>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<ITest[]>;
  findActiveTests(): Promise<ITest[]>;
  
  // Test combinations
  findTestPackages(): Promise<ITest[]>;
  findRelatedTests(testId: string | Types.ObjectId): Promise<ITest[]>;
  
  // Search functionality
  searchTests(query: {
    searchTerm?: string;
    category?: string;
    priceRange?: { min: number; max: number };
    isActive?: boolean;
    labId?: string | Types.ObjectId;
  }): Promise<ITest[]>;
  
  // Pricing and analytics
  getTestStats(): Promise<{
    total: number;
    active: number;
    byCategory: Record<string, number>;
    averagePrice: number;
    priceRanges: Record<string, number>;
  }>;
  
  // Lab-specific tests
  findByLabId(labId: string | Types.ObjectId): Promise<ITest[]>;
  updateLabPricing(labId: string | Types.ObjectId, testId: string | Types.ObjectId, price: number): Promise<boolean>;
}