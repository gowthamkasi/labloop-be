/**
 * Hospital Repository Implementation for LabLoop Healthcare System
 * Provides hospital-specific data access methods with healthcare compliance
 */

import { FilterQuery, Types, ClientSession, PipelineStage } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { Hospital } from '../models/Hospital.js';
import { IHospital, HospitalType, IAccreditation } from '@/application/types/index.js';
import { IHospitalRepository } from '@/application/interfaces/repositories/index.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';

export class HospitalRepository extends BaseRepository<IHospital> implements IHospitalRepository {
  constructor(logger: ILogger) {
    super(Hospital, logger);
  }

  // ====================== HOSPITAL-SPECIFIC FINDERS ======================

  async findByHospitalId(hospitalId: string): Promise<IHospital | null> {
    try {
      this.logger.debug('Finding hospital by hospitalId', { hospitalId });
      const hospital = await Hospital.findByHospitalId(hospitalId);
      
      if (hospital) {
        await this.logAudit('read', hospital._id);
      }
      
      return hospital;
    } catch (error) {
      this.logger.error('Failed to find hospital by hospitalId', error as Error);
      throw new DatabaseError('Failed to find hospital by hospitalId', {
        originalError: error,
        operation: 'findByHospitalId',
        hospitalId,
      });
    }
  }

  async findByLicenseNumber(licenseNumber: string): Promise<IHospital | null> {
    try {
      this.logger.debug('Finding hospital by license number', { licenseNumber });
      const hospital = await Hospital.findByLicenseNumber(licenseNumber);
      
      if (hospital) {
        await this.logAudit('read', hospital._id);
      }
      
      return hospital;
    } catch (error) {
      this.logger.error('Failed to find hospital by license number', error as Error);
      throw new DatabaseError('Failed to find hospital by license number', {
        originalError: error,
        operation: 'findByLicenseNumber',
        licenseNumber,
      });
    }
  }

  async findActiveHospitals(additionalFilter: FilterQuery<IHospital> = {}): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding active hospitals', { additionalFilter });
      return await Hospital.findActiveHospitals(additionalFilter);
    } catch (error) {
      this.logger.error('Failed to find active hospitals', error as Error);
      throw new DatabaseError('Failed to find active hospitals', {
        originalError: error,
        operation: 'findActiveHospitals',
      });
    }
  }

  async findByCity(city: string): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding hospitals by city', { city });
      return await Hospital.findByCity(city);
    } catch (error) {
      this.logger.error('Failed to find hospitals by city', error as Error);
      throw new DatabaseError('Failed to find hospitals by city', {
        originalError: error,
        operation: 'findByCity',
        city,
      });
    }
  }

  async findByType(hospitalType: HospitalType): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding hospitals by type', { hospitalType });
      return await Hospital.findByType(hospitalType);
    } catch (error) {
      this.logger.error('Failed to find hospitals by type', error as Error);
      throw new DatabaseError('Failed to find hospitals by type', {
        originalError: error,
        operation: 'findByType',
        hospitalType,
      });
    }
  }

  async findEmergencyHospitals(city?: string): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding emergency hospitals', { city });
      return await Hospital.findEmergencyHospitals(city);
    } catch (error) {
      this.logger.error('Failed to find emergency hospitals', error as Error);
      throw new DatabaseError('Failed to find emergency hospitals', {
        originalError: error,
        operation: 'findEmergencyHospitals',
        city,
      });
    }
  }

  async findNearby(
    longitude: number, 
    latitude: number, 
    maxDistanceKm: number = 10
  ): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding nearby hospitals', { 
        longitude, 
        latitude, 
        maxDistanceKm 
      });
      
      return await Hospital.findNearby(longitude, latitude, maxDistanceKm);
    } catch (error) {
      this.logger.error('Failed to find nearby hospitals', error as Error);
      throw new DatabaseError('Failed to find nearby hospitals', {
        originalError: error,
        operation: 'findNearby',
        coordinates: [longitude, latitude],
        maxDistanceKm,
      });
    }
  }

  async findWithAttachedLabs(): Promise<IHospital[]> {
    try {
      this.logger.debug('Finding hospitals with attached labs');
      return await Hospital.findWithAttachedLabs();
    } catch (error) {
      this.logger.error('Failed to find hospitals with attached labs', error as Error);
      throw new DatabaseError('Failed to find hospitals with attached labs', {
        originalError: error,
        operation: 'findWithAttachedLabs',
      });
    }
  }

  // ====================== HOSPITAL OPERATIONS ======================

  async addAttachedLab(
    hospitalId: string, 
    labId: Types.ObjectId,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Adding attached lab to hospital', { hospitalId, labId });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      await hospital.addAttachedLab(labId);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, undefined, { 
        action: 'addAttachedLab',
        labId 
      });

      this.logger.info('Added attached lab to hospital', { hospitalId, labId });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to add attached lab to hospital', error as Error);
      throw new DatabaseError('Failed to add attached lab to hospital', {
        originalError: error,
        operation: 'addAttachedLab',
        hospitalId,
        labId,
      });
    }
  }

  async removeAttachedLab(
    hospitalId: string, 
    labId: Types.ObjectId,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Removing attached lab from hospital', { hospitalId, labId });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      await hospital.removeAttachedLab(labId);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, undefined, { 
        action: 'removeAttachedLab',
        labId 
      });

      this.logger.info('Removed attached lab from hospital', { hospitalId, labId });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to remove attached lab from hospital', error as Error);
      throw new DatabaseError('Failed to remove attached lab from hospital', {
        originalError: error,
        operation: 'removeAttachedLab',
        hospitalId,
        labId,
      });
    }
  }

  async updateCapacity(
    hospitalId: string,
    bedCapacity: number,
    icuBeds?: number,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Updating hospital capacity', { 
        hospitalId, 
        bedCapacity, 
        icuBeds 
      });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      const originalData = { 
        bedCapacity: hospital.bedCapacity, 
        icuBeds: hospital.icuBeds 
      };

      await hospital.updateCapacity(bedCapacity, icuBeds);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, originalData, { 
        bedCapacity: hospital.bedCapacity,
        icuBeds: hospital.icuBeds
      });

      this.logger.info('Updated hospital capacity', { hospitalId, bedCapacity, icuBeds });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to update hospital capacity', error as Error);
      throw new DatabaseError('Failed to update hospital capacity', {
        originalError: error,
        operation: 'updateCapacity',
        hospitalId,
        bedCapacity,
        icuBeds,
      });
    }
  }

  async updateRating(
    hospitalId: string,
    newRating: number,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Updating hospital rating', { hospitalId, newRating });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      const originalRating = {
        averageRating: hospital.mobileFields.averageRating,
        reviewCount: hospital.mobileFields.reviewCount
      };

      await hospital.updateRating(newRating);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, originalRating, { 
        averageRating: hospital.mobileFields.averageRating,
        reviewCount: hospital.mobileFields.reviewCount,
        newRating
      });

      this.logger.info('Updated hospital rating', { 
        hospitalId, 
        newRating,
        averageRating: hospital.mobileFields.averageRating 
      });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to update hospital rating', error as Error);
      throw new DatabaseError('Failed to update hospital rating', {
        originalError: error,
        operation: 'updateRating',
        hospitalId,
        newRating,
      });
    }
  }

  async addDepartment(
    hospitalId: string,
    department: string,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Adding department to hospital', { hospitalId, department });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      await hospital.addDepartment(department);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, undefined, { 
        action: 'addDepartment',
        department 
      });

      this.logger.info('Added department to hospital', { hospitalId, department });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to add department to hospital', error as Error);
      throw new DatabaseError('Failed to add department to hospital', {
        originalError: error,
        operation: 'addDepartment',
        hospitalId,
        department,
      });
    }
  }

  async updateAccreditation(
    hospitalId: string,
    accreditation: Partial<IAccreditation>,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Updating hospital accreditation', { hospitalId, accreditation });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      const originalAccreditation = { ...hospital.accreditation };
      await hospital.updateAccreditation(accreditation);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, { 
        accreditation: originalAccreditation 
      }, { 
        accreditation: hospital.accreditation 
      });

      this.logger.info('Updated hospital accreditation', { hospitalId, accreditation });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to update hospital accreditation', error as Error);
      throw new DatabaseError('Failed to update hospital accreditation', {
        originalError: error,
        operation: 'updateAccreditation',
        hospitalId,
        accreditation,
      });
    }
  }

  async verifyHospital(
    hospitalId: string,
    verifiedBy?: Types.ObjectId,
    session?: ClientSession
  ): Promise<IHospital | null> {
    try {
      this.logger.debug('Verifying hospital', { hospitalId, verifiedBy });

      const hospital = await this.findByHospitalId(hospitalId);
      if (!hospital) {
        throw new DatabaseError('Hospital not found', { hospitalId });
      }

      await hospital.verify(verifiedBy);
      
      // Log audit trail
      await this.logAudit('update', hospital._id, { 
        verified: false 
      }, { 
        verified: true,
        verifiedBy,
        verifiedAt: hospital.status.verifiedAt
      });

      this.logger.info('Hospital verified successfully', { hospitalId, verifiedBy });
      return hospital;
    } catch (error) {
      this.logger.error('Failed to verify hospital', error as Error);
      throw new DatabaseError('Failed to verify hospital', {
        originalError: error,
        operation: 'verifyHospital',
        hospitalId,
        verifiedBy,
      });
    }
  }

  // ====================== ANALYTICS AND REPORTING ======================

  async getHospitalStats(hospitalId?: string): Promise<any> {
    try {
      this.logger.debug('Getting hospital statistics', { hospitalId });

      const matchStage: any = {
        'metadata.deletedAt': { $exists: false },
        'status.isActive': true,
      };

      if (hospitalId) {
        matchStage.hospitalId = hospitalId;
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalHospitals: { $sum: 1 },
            verifiedHospitals: {
              $sum: { $cond: ['$status.isVerified', 1, 0] }
            },
            emergencyHospitals: {
              $sum: { $cond: ['$emergencyServices', 1, 0] }
            },
            totalBeds: { $sum: '$bedCapacity' },
            totalIcuBeds: { $sum: '$icuBeds' },
            avgRating: { $avg: '$mobileFields.averageRating' },
            totalReviews: { $sum: '$mobileFields.reviewCount' },
          }
        }
      ];

      const [stats] = await this.aggregate(pipeline);
      
      return stats || {
        totalHospitals: 0,
        verifiedHospitals: 0,
        emergencyHospitals: 0,
        totalBeds: 0,
        totalIcuBeds: 0,
        avgRating: 0,
        totalReviews: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get hospital statistics', error as Error);
      throw new DatabaseError('Failed to get hospital statistics', {
        originalError: error,
        operation: 'getHospitalStats',
        hospitalId,
      });
    }
  }

  async getHospitalsByAccreditation(): Promise<any> {
    try {
      this.logger.debug('Getting hospitals by accreditation');

      const pipeline: PipelineStage[] = [
        {
          $match: {
            'metadata.deletedAt': { $exists: false },
            'status.isActive': true,
          }
        },
        {
          $group: {
            _id: null,
            nabhAccredited: {
              $sum: { $cond: ['$accreditation.nabh', 1, 0] }
            },
            nablAccredited: {
              $sum: { $cond: ['$accreditation.nabl', 1, 0] }
            },
            jciAccredited: {
              $sum: { $cond: ['$accreditation.jci', 1, 0] }
            },
            isoAccredited: {
              $sum: { $cond: ['$accreditation.iso', 1, 0] }
            },
            fullyAccredited: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      '$accreditation.nabh',
                      '$accreditation.nabl'
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ];

      const [accreditationStats] = await this.aggregate(pipeline);
      return accreditationStats;
    } catch (error) {
      this.logger.error('Failed to get hospitals by accreditation', error as Error);
      throw new DatabaseError('Failed to get hospitals by accreditation', {
        originalError: error,
        operation: 'getHospitalsByAccreditation',
      });
    }
  }

  async getTopRatedHospitals(limit: number = 10): Promise<IHospital[]> {
    try {
      this.logger.debug('Getting top rated hospitals', { limit });

      return await this.findMany(
        {
          'status.isActive': true,
          'mobileFields.reviewCount': { $gte: 5 } // Only hospitals with at least 5 reviews
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
      this.logger.error('Failed to get top rated hospitals', error as Error);
      throw new DatabaseError('Failed to get top rated hospitals', {
        originalError: error,
        operation: 'getTopRatedHospitals',
        limit,
      });
    }
  }

  // ====================== SEARCH FUNCTIONALITY ======================

  async searchHospitals(
    searchTerm: string,
    filters: {
      city?: string;
      hospitalType?: HospitalType;
      emergencyServices?: boolean;
      minRating?: number;
    } = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<IHospital[]> {
    try {
      this.logger.debug('Searching hospitals', { searchTerm, filters, options });

      const query: FilterQuery<IHospital> = {
        'status.isActive': true,
        $text: { $search: searchTerm },
      };

      // Apply filters
      if (filters.city) {
        query['address.city'] = new RegExp(filters.city, 'i');
      }

      if (filters.hospitalType) {
        query.hospitalType = filters.hospitalType;
      }

      if (filters.emergencyServices !== undefined) {
        query.emergencyServices = filters.emergencyServices;
      }

      if (filters.minRating) {
        query['mobileFields.averageRating'] = { $gte: filters.minRating };
      }

      const searchOptions = {
        sort: options.sort || { score: { $meta: 'textScore' } },
        limit: options.limit,
        skip: options.skip,
      };

      return await this.findMany(query, searchOptions);
    } catch (error) {
      this.logger.error('Failed to search hospitals', error as Error);
      throw new DatabaseError('Failed to search hospitals', {
        originalError: error,
        operation: 'searchHospitals',
        searchTerm,
        filters,
      });
    }
  }
}