/**
 * Lab Repository Implementation for LabLoop Healthcare System
 * Provides lab-specific data access methods with healthcare compliance
 */

import { FilterQuery, Types, ClientSession, PipelineStage } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { Lab } from '../models/Lab.js';
import { ILab, LabType, LabOwnership, ILabOperationalStats } from '@/application/types/index.js';
import { ILabRepository } from '@/application/interfaces/repositories/index.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';

export class LabRepository extends BaseRepository<ILab> implements ILabRepository {
  constructor(logger: ILogger) {
    super(Lab, logger);
  }

  // ====================== LAB-SPECIFIC FINDERS ======================

  async findByLabId(labId: string): Promise<ILab | null> {
    try {
      this.logger.debug('Finding lab by labId', { labId });
      const lab = await Lab.findByLabId(labId);
      
      if (lab) {
        await this.logAudit('read', lab._id);
      }
      
      return lab;
    } catch (error) {
      this.logger.error('Failed to find lab by labId', error as Error);
      throw new DatabaseError('Failed to find lab by labId', {
        originalError: error,
        operation: 'findByLabId',
        labId,
      });
    }
  }

  async findByLicenseNumber(licenseNumber: string): Promise<ILab | null> {
    try {
      this.logger.debug('Finding lab by license number', { licenseNumber });
      const lab = await Lab.findByLicenseNumber(licenseNumber);
      
      if (lab) {
        await this.logAudit('read', lab._id);
      }
      
      return lab;
    } catch (error) {
      this.logger.error('Failed to find lab by license number', error as Error);
      throw new DatabaseError('Failed to find lab by license number', {
        originalError: error,
        operation: 'findByLicenseNumber',
        licenseNumber,
      });
    }
  }

  async findActiveLabs(additionalFilter: FilterQuery<ILab> = {}): Promise<ILab[]> {
    try {
      this.logger.debug('Finding active labs', { additionalFilter });
      return await Lab.findActiveLabs(additionalFilter);
    } catch (error) {
      this.logger.error('Failed to find active labs', error as Error);
      throw new DatabaseError('Failed to find active labs', {
        originalError: error,
        operation: 'findActiveLabs',
      });
    }
  }

  async findByType(labType: LabType): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs by type', { labType });
      return await Lab.findByType(labType);
    } catch (error) {
      this.logger.error('Failed to find labs by type', error as Error);
      throw new DatabaseError('Failed to find labs by type', {
        originalError: error,
        operation: 'findByType',
        labType,
      });
    }
  }

  async findByOwnership(ownership: LabOwnership): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs by ownership', { ownership });
      return await Lab.findByOwnership(ownership);
    } catch (error) {
      this.logger.error('Failed to find labs by ownership', error as Error);
      throw new DatabaseError('Failed to find labs by ownership', {
        originalError: error,
        operation: 'findByOwnership',
        ownership,
      });
    }
  }

  async findByCity(city: string): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs by city', { city });
      return await Lab.findByCity(city);
    } catch (error) {
      this.logger.error('Failed to find labs by city', error as Error);
      throw new DatabaseError('Failed to find labs by city', {
        originalError: error,
        operation: 'findByCity',
        city,
      });
    }
  }

  async findWithHomeCollection(city?: string): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs with home collection', { city });
      return await Lab.findWithHomeCollection(city);
    } catch (error) {
      this.logger.error('Failed to find labs with home collection', error as Error);
      throw new DatabaseError('Failed to find labs with home collection', {
        originalError: error,
        operation: 'findWithHomeCollection',
        city,
      });
    }
  }

  async findNearby(
    longitude: number, 
    latitude: number, 
    maxDistanceKm: number = 10
  ): Promise<ILab[]> {
    try {
      this.logger.debug('Finding nearby labs', { 
        longitude, 
        latitude, 
        maxDistanceKm 
      });
      
      return await Lab.findNearby(longitude, latitude, maxDistanceKm);
    } catch (error) {
      this.logger.error('Failed to find nearby labs', error as Error);
      throw new DatabaseError('Failed to find nearby labs', {
        originalError: error,
        operation: 'findNearby',
        coordinates: [longitude, latitude],
        maxDistanceKm,
      });
    }
  }

  async findByParentHospital(hospitalId: Types.ObjectId): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs by parent hospital', { hospitalId });
      return await Lab.findByParentHospital(hospitalId);
    } catch (error) {
      this.logger.error('Failed to find labs by parent hospital', error as Error);
      throw new DatabaseError('Failed to find labs by parent hospital', {
        originalError: error,
        operation: 'findByParentHospital',
        hospitalId,
      });
    }
  }

  async findAccredited(): Promise<ILab[]> {
    try {
      this.logger.debug('Finding accredited labs');
      return await Lab.findAccredited();
    } catch (error) {
      this.logger.error('Failed to find accredited labs', error as Error);
      throw new DatabaseError('Failed to find accredited labs', {
        originalError: error,
        operation: 'findAccredited',
      });
    }
  }

  // ====================== LAB OPERATIONS ======================

  async addCollectionCenter(
    labId: string, 
    centerId: Types.ObjectId,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Adding collection center to lab', { labId, centerId });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      await lab.addCollectionCenter(centerId);
      
      // Log audit trail
      await this.logAudit('update', lab._id, undefined, { 
        action: 'addCollectionCenter',
        centerId 
      });

      this.logger.info('Added collection center to lab', { labId, centerId });
      return lab;
    } catch (error) {
      this.logger.error('Failed to add collection center to lab', error as Error);
      throw new DatabaseError('Failed to add collection center to lab', {
        originalError: error,
        operation: 'addCollectionCenter',
        labId,
        centerId,
      });
    }
  }

  async removeCollectionCenter(
    labId: string, 
    centerId: Types.ObjectId,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Removing collection center from lab', { labId, centerId });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      await lab.removeCollectionCenter(centerId);
      
      // Log audit trail
      await this.logAudit('update', lab._id, undefined, { 
        action: 'removeCollectionCenter',
        centerId 
      });

      this.logger.info('Removed collection center from lab', { labId, centerId });
      return lab;
    } catch (error) {
      this.logger.error('Failed to remove collection center from lab', error as Error);
      throw new DatabaseError('Failed to remove collection center from lab', {
        originalError: error,
        operation: 'removeCollectionCenter',
        labId,
        centerId,
      });
    }
  }

  async updateCapacity(
    labId: string,
    dailyCapacity: number,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Updating lab capacity', { labId, dailyCapacity });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      const originalCapacity = lab.capabilities.dailyCapacity;
      await lab.updateCapacity(dailyCapacity);
      
      // Log audit trail
      await this.logAudit('update', lab._id, { 
        dailyCapacity: originalCapacity 
      }, { 
        dailyCapacity: lab.capabilities.dailyCapacity 
      });

      this.logger.info('Updated lab capacity', { labId, dailyCapacity });
      return lab;
    } catch (error) {
      this.logger.error('Failed to update lab capacity', error as Error);
      throw new DatabaseError('Failed to update lab capacity', {
        originalError: error,
        operation: 'updateCapacity',
        labId,
        dailyCapacity,
      });
    }
  }

  async updateRating(
    labId: string,
    newRating: number,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Updating lab rating', { labId, newRating });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      const originalRating = {
        averageRating: lab.mobileFields.averageRating,
        reviewCount: lab.mobileFields.reviewCount
      };

      await lab.updateRating(newRating);
      
      // Log audit trail
      await this.logAudit('update', lab._id, originalRating, { 
        averageRating: lab.mobileFields.averageRating,
        reviewCount: lab.mobileFields.reviewCount,
        newRating
      });

      this.logger.info('Updated lab rating', { 
        labId, 
        newRating,
        averageRating: lab.mobileFields.averageRating 
      });
      return lab;
    } catch (error) {
      this.logger.error('Failed to update lab rating', error as Error);
      throw new DatabaseError('Failed to update lab rating', {
        originalError: error,
        operation: 'updateRating',
        labId,
        newRating,
      });
    }
  }

  async addTestCategory(
    labId: string,
    category: string,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Adding test category to lab', { labId, category });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      await lab.addTestCategory(category);
      
      // Log audit trail
      await this.logAudit('update', lab._id, undefined, { 
        action: 'addTestCategory',
        category 
      });

      this.logger.info('Added test category to lab', { labId, category });
      return lab;
    } catch (error) {
      this.logger.error('Failed to add test category to lab', error as Error);
      throw new DatabaseError('Failed to add test category to lab', {
        originalError: error,
        operation: 'addTestCategory',
        labId,
        category,
      });
    }
  }

  async updateStats(
    labId: string,
    stats: Partial<ILabOperationalStats>,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Updating lab operational stats', { labId, stats });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      const originalStats = { ...lab.operationalStats };
      await lab.updateStats(stats);
      
      // Log audit trail
      await this.logAudit('update', lab._id, { 
        operationalStats: originalStats 
      }, { 
        operationalStats: lab.operationalStats 
      });

      this.logger.info('Updated lab operational stats', { labId, stats });
      return lab;
    } catch (error) {
      this.logger.error('Failed to update lab operational stats', error as Error);
      throw new DatabaseError('Failed to update lab operational stats', {
        originalError: error,
        operation: 'updateStats',
        labId,
        stats,
      });
    }
  }

  async verifyLab(
    labId: string,
    verifiedBy?: Types.ObjectId,
    session?: ClientSession
  ): Promise<ILab | null> {
    try {
      this.logger.debug('Verifying lab', { labId, verifiedBy });

      const lab = await this.findByLabId(labId);
      if (!lab) {
        throw new DatabaseError('Lab not found', { labId });
      }

      await lab.verify(verifiedBy);
      
      // Log audit trail
      await this.logAudit('update', lab._id, { 
        verified: false 
      }, { 
        verified: true,
        verifiedBy,
        verifiedAt: lab.status.verifiedAt
      });

      this.logger.info('Lab verified successfully', { labId, verifiedBy });
      return lab;
    } catch (error) {
      this.logger.error('Failed to verify lab', error as Error);
      throw new DatabaseError('Failed to verify lab', {
        originalError: error,
        operation: 'verifyLab',
        labId,
        verifiedBy,
      });
    }
  }

  // ====================== ANALYTICS AND REPORTING ======================

  async getLabStats(labId?: string): Promise<any> {
    try {
      this.logger.debug('Getting lab statistics', { labId });

      const matchStage: any = {
        'metadata.deletedAt': { $exists: false },
        'status.isActive': true,
      };

      if (labId) {
        matchStage.labId = labId;
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalLabs: { $sum: 1 },
            verifiedLabs: {
              $sum: { $cond: ['$status.isVerified', 1, 0] }
            },
            independentLabs: {
              $sum: { $cond: [{ $eq: ['$ownership', 'independent'] }, 1, 0] }
            },
            hospitalAttachedLabs: {
              $sum: { $cond: [{ $eq: ['$ownership', 'hospitalAttached'] }, 1, 0] }
            },
            homeCollectionLabs: {
              $sum: { $cond: ['$capabilities.homeCollection', 1, 0] }
            },
            avgRating: { $avg: '$mobileFields.averageRating' },
            totalReviews: { $sum: '$mobileFields.reviewCount' },
            totalDailyCapacity: { $sum: '$capabilities.dailyCapacity' },
            avgCompletionRate: { $avg: '$operationalStats.completionRate' },
          }
        }
      ];

      const [stats] = await this.aggregate(pipeline);
      
      return stats || {
        totalLabs: 0,
        verifiedLabs: 0,
        independentLabs: 0,
        hospitalAttachedLabs: 0,
        homeCollectionLabs: 0,
        avgRating: 0,
        totalReviews: 0,
        totalDailyCapacity: 0,
        avgCompletionRate: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get lab statistics', error as Error);
      throw new DatabaseError('Failed to get lab statistics', {
        originalError: error,
        operation: 'getLabStats',
        labId,
      });
    }
  }

  async getLabsByType(): Promise<any> {
    try {
      this.logger.debug('Getting labs by type');

      const pipeline: PipelineStage[] = [
        {
          $match: {
            'metadata.deletedAt': { $exists: false },
            'status.isActive': true,
          }
        },
        {
          $group: {
            _id: '$labType',
            count: { $sum: 1 },
            avgRating: { $avg: '$mobileFields.averageRating' },
            avgCapacity: { $avg: '$capabilities.dailyCapacity' },
          }
        },
        { $sort: { count: -1 } }
      ];

      return await this.aggregate(pipeline);
    } catch (error) {
      this.logger.error('Failed to get labs by type', error as Error);
      throw new DatabaseError('Failed to get labs by type', {
        originalError: error,
        operation: 'getLabsByType',
      });
    }
  }

  async getTopRatedLabs(limit: number = 10): Promise<ILab[]> {
    try {
      this.logger.debug('Getting top rated labs', { limit });

      return await this.findMany(
        {
          'status.isActive': true,
          'mobileFields.reviewCount': { $gte: 5 } // Only labs with at least 5 reviews
        },
        {
          sort: { 
            'mobileFields.averageRating': -1, 
            'mobileFields.reviewCount': -1 
          },
          limit,
        }
      );
    } catch (error) {
      this.logger.error('Failed to get top rated labs', error as Error);
      throw new DatabaseError('Failed to get top rated labs', {
        originalError: error,
        operation: 'getTopRatedLabs',
        limit,
      });
    }
  }

  async getLabsByCity(): Promise<any> {
    try {
      this.logger.debug('Getting labs distribution by city');

      const pipeline: PipelineStage[] = [
        {
          $match: {
            'metadata.deletedAt': { $exists: false },
            'status.isActive': true,
          }
        },
        {
          $group: {
            _id: '$address.city',
            labCount: { $sum: 1 },
            homeCollectionCount: {
              $sum: { $cond: ['$capabilities.homeCollection', 1, 0] }
            },
            avgRating: { $avg: '$mobileFields.averageRating' },
            totalCapacity: { $sum: '$capabilities.dailyCapacity' },
          }
        },
        { $sort: { labCount: -1 } }
      ];

      return await this.aggregate(pipeline);
    } catch (error) {
      this.logger.error('Failed to get labs by city', error as Error);
      throw new DatabaseError('Failed to get labs by city', {
        originalError: error,
        operation: 'getLabsByCity',
      });
    }
  }

  // ====================== SEARCH FUNCTIONALITY ======================

  async searchLabs(
    searchTerm: string,
    filters: {
      city?: string;
      labType?: LabType;
      ownership?: LabOwnership;
      homeCollection?: boolean;
      emergencyServices?: boolean;
      minRating?: number;
      testCategories?: string[];
    } = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<ILab[]> {
    try {
      this.logger.debug('Searching labs', { searchTerm, filters, options });

      const query: FilterQuery<ILab> = {
        'status.isActive': true,
        $text: { $search: searchTerm },
      };

      // Apply filters
      if (filters.city) {
        query['address.city'] = new RegExp(filters.city, 'i');
      }

      if (filters.labType) {
        query.labType = filters.labType;
      }

      if (filters.ownership) {
        query.ownership = filters.ownership;
      }

      if (filters.homeCollection !== undefined) {
        query['capabilities.homeCollection'] = filters.homeCollection;
      }

      if (filters.emergencyServices !== undefined) {
        query['capabilities.emergencyServices'] = filters.emergencyServices;
      }

      if (filters.minRating) {
        query['mobileFields.averageRating'] = { $gte: filters.minRating };
      }

      if (filters.testCategories && filters.testCategories.length > 0) {
        query['capabilities.testCategories'] = { $in: filters.testCategories };
      }

      const searchOptions = {
        sort: options.sort || { score: { $meta: 'textScore' } },
        limit: options.limit,
        skip: options.skip,
      };

      return await this.findMany(query, searchOptions);
    } catch (error) {
      this.logger.error('Failed to search labs', error as Error);
      throw new DatabaseError('Failed to search labs', {
        originalError: error,
        operation: 'searchLabs',
        searchTerm,
        filters,
      });
    }
  }

  async findLabsWithCapacity(
    minCapacity: number = 1,
    city?: string
  ): Promise<ILab[]> {
    try {
      this.logger.debug('Finding labs with minimum capacity', { minCapacity, city });

      const query: FilterQuery<ILab> = {
        'status.isActive': true,
        'capabilities.dailyCapacity': { $gte: minCapacity },
      };

      if (city) {
        query['address.city'] = new RegExp(city, 'i');
      }

      return await this.findMany(query, {
        sort: { 'capabilities.dailyCapacity': -1 }
      });
    } catch (error) {
      this.logger.error('Failed to find labs with capacity', error as Error);
      throw new DatabaseError('Failed to find labs with capacity', {
        originalError: error,
        operation: 'findLabsWithCapacity',
        minCapacity,
        city,
      });
    }
  }
}