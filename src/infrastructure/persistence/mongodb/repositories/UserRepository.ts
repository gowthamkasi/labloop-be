/**
 * User Repository Implementation for LabLoop Healthcare System
 * Handles all database operations for unified B2B/B2C users with healthcare compliance
 */

import { Types } from 'mongoose';
import { BaseRepository } from './BaseRepository.js';
import { IUserRepository } from '@/application/interfaces/repositories/IUserRepository.js';
import { IUser, UserRole, UserType, IUserPermissions } from '@/application/types/index.js';
import { User } from '../models/User.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(logger: ILogger) {
    super(User, logger);
  }

  // ====================== AUTHENTICATION METHODS ======================

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      this.logger.debug('Finding user by email', { email });
      return await User.findOne({ 
        email: email.toLowerCase().trim(),
        'metadata.deletedAt': { $exists: false }
      }).select('+passwordHash');
    } catch (error) {
      this.logger.error('Failed to find user by email', error as Error);
      throw new DatabaseError('Failed to find user by email', {
        originalError: error,
        email,
      });
    }
  }

  async findByUsername(username: string): Promise<IUser | null> {
    try {
      this.logger.debug('Finding user by username', { username });
      return await User.findOne({ 
        username: username.toLowerCase().trim(),
        'metadata.deletedAt': { $exists: false }
      }).select('+passwordHash');
    } catch (error) {
      this.logger.error('Failed to find user by username', error as Error);
      throw new DatabaseError('Failed to find user by username', {
        originalError: error,
        username,
      });
    }
  }

  async findByMobileNumber(mobileNumber: string): Promise<IUser | null> {
    try {
      this.logger.debug('Finding user by mobile number', { mobileNumber });
      return await User.findOne({ 
        'profile.mobileNumber': mobileNumber,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find user by mobile number', error as Error);
      throw new DatabaseError('Failed to find user by mobile number', {
        originalError: error,
        mobileNumber,
      });
    }
  }

  async findByUserId(userId: string): Promise<IUser | null> {
    try {
      this.logger.debug('Finding user by userId', { userId });
      return await User.findOne({ 
        userId,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find user by userId', error as Error);
      throw new DatabaseError('Failed to find user by userId', {
        originalError: error,
        userId,
      });
    }
  }

  // ====================== PASSWORD AND AUTHENTICATION ======================

  async updatePassword(userId: string | Types.ObjectId, passwordHash: string): Promise<boolean> {
    try {
      this.logger.debug('Updating user password', { userId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          passwordHash,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update user password', error as Error);
      throw new DatabaseError('Failed to update user password', {
        originalError: error,
        userId,
      });
    }
  }

  async updateRefreshToken(userId: string | Types.ObjectId, refreshToken: string | null): Promise<boolean> {
    try {
      this.logger.debug('Updating refresh token', { userId });
      const update = refreshToken 
        ? { 'authentication.refreshToken': refreshToken }
        : { $unset: { 'authentication.refreshToken': 1 } };
      
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        {
          ...update,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update refresh token', error as Error);
      throw new DatabaseError('Failed to update refresh token', {
        originalError: error,
        userId,
      });
    }
  }

  async incrementLoginAttempts(userId: string | Types.ObjectId): Promise<void> {
    try {
      this.logger.debug('Incrementing login attempts', { userId });
      const user = await User.findById(userId);
      if (user) {
        await user.incrementLoginAttempts();
      }
    } catch (error) {
      this.logger.error('Failed to increment login attempts', error as Error);
      throw new DatabaseError('Failed to increment login attempts', {
        originalError: error,
        userId,
      });
    }
  }

  async resetLoginAttempts(userId: string | Types.ObjectId): Promise<void> {
    try {
      this.logger.debug('Resetting login attempts', { userId });
      const user = await User.findById(userId);
      if (user) {
        await user.resetLoginAttempts();
      }
    } catch (error) {
      this.logger.error('Failed to reset login attempts', error as Error);
      throw new DatabaseError('Failed to reset login attempts', {
        originalError: error,
        userId,
      });
    }
  }

  async lockAccount(userId: string | Types.ObjectId, lockUntil: Date): Promise<void> {
    try {
      this.logger.debug('Locking user account', { userId, lockUntil });
      await User.updateOne(
        { _id: userId },
        { 
          'authentication.lockedUntil': lockUntil,
          'metadata.updatedAt': new Date()
        }
      );
    } catch (error) {
      this.logger.error('Failed to lock user account', error as Error);
      throw new DatabaseError('Failed to lock user account', {
        originalError: error,
        userId,
      });
    }
  }

  async updateLastLogin(userId: string | Types.ObjectId): Promise<void> {
    try {
      this.logger.debug('Updating last login', { userId });
      await User.updateOne(
        { _id: userId },
        { 
          'authentication.lastLogin': new Date(),
          'metadata.updatedAt': new Date()
        }
      );
    } catch (error) {
      this.logger.error('Failed to update last login', error as Error);
      throw new DatabaseError('Failed to update last login', {
        originalError: error,
        userId,
      });
    }
  }

  // ====================== ROLE AND PERMISSION MANAGEMENT ======================

  async findByRole(role: UserRole, organizationId?: string | Types.ObjectId): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users by role', { role, organizationId });
      const query: any = { 
        role,
        'metadata.deletedAt': { $exists: false }
      };
      
      if (organizationId) {
        query['employment.organizationId'] = organizationId;
      }

      return await User.find(query);
    } catch (error) {
      this.logger.error('Failed to find users by role', error as Error);
      throw new DatabaseError('Failed to find users by role', {
        originalError: error,
        role,
        organizationId,
      });
    }
  }

  async findByUserType(userType: UserType): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users by user type', { userType });
      return await User.find({ 
        userType,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users by user type', error as Error);
      throw new DatabaseError('Failed to find users by user type', {
        originalError: error,
        userType,
      });
    }
  }

  async updatePermissions(userId: string | Types.ObjectId, permissions: Partial<IUserPermissions>): Promise<boolean> {
    try {
      this.logger.debug('Updating user permissions', { userId, permissions });
      const updateData: any = {};
      
      Object.keys(permissions).forEach(key => {
        updateData[`permissions.${key}`] = permissions[key as keyof IUserPermissions];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update user permissions', error as Error);
      throw new DatabaseError('Failed to update user permissions', {
        originalError: error,
        userId,
      });
    }
  }

  async getUsersWithPermission(permission: keyof IUserPermissions, value: boolean): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users with permission', { permission, value });
      return await User.find({ 
        [`permissions.${permission}`]: value,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users with permission', error as Error);
      throw new DatabaseError('Failed to find users with permission', {
        originalError: error,
        permission,
        value,
      });
    }
  }

  // ====================== ORGANIZATION AND EMPLOYMENT ======================

  async findByOrganization(organizationId: string | Types.ObjectId): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users by organization', { organizationId });
      return await User.find({ 
        'employment.organizationId': organizationId,
        'status.isActive': true,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users by organization', error as Error);
      throw new DatabaseError('Failed to find users by organization', {
        originalError: error,
        organizationId,
      });
    }
  }

  async findReportingUsers(managerId: string | Types.ObjectId): Promise<IUser[]> {
    try {
      this.logger.debug('Finding reporting users', { managerId });
      return await User.find({ 
        'employment.reportingTo': managerId,
        'status.isActive': true,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find reporting users', error as Error);
      throw new DatabaseError('Failed to find reporting users', {
        originalError: error,
        managerId,
      });
    }
  }

  async updateEmployment(userId: string | Types.ObjectId, employment: Partial<IUser['employment']>): Promise<boolean> {
    try {
      this.logger.debug('Updating user employment', { userId, employment });
      const updateData: any = {};
      
      Object.keys(employment).forEach(key => {
        updateData[`employment.${key}`] = employment[key as keyof IUser['employment']];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update user employment', error as Error);
      throw new DatabaseError('Failed to update user employment', {
        originalError: error,
        userId,
      });
    }
  }

  // ====================== CONSUMER USER MANAGEMENT ======================

  async findManagedPatients(userId: string | Types.ObjectId): Promise<IUser[]> {
    try {
      this.logger.debug('Finding managed patients', { userId });
      const user = await User.findById(userId).populate('managedPatients');
      return user?.managedPatients as unknown as IUser[] || [];
    } catch (error) {
      this.logger.error('Failed to find managed patients', error as Error);
      throw new DatabaseError('Failed to find managed patients', {
        originalError: error,
        userId,
      });
    }
  }

  async addManagedPatient(userId: string | Types.ObjectId, patientId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Adding managed patient', { userId, patientId });
      const result = await User.updateOne(
        { 
          _id: userId,
          managedPatients: { $ne: patientId },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $push: { managedPatients: patientId },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to add managed patient', error as Error);
      throw new DatabaseError('Failed to add managed patient', {
        originalError: error,
        userId,
        patientId,
      });
    }
  }

  async removeManagedPatient(userId: string | Types.ObjectId, patientId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Removing managed patient', { userId, patientId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          $pull: { managedPatients: patientId },
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to remove managed patient', error as Error);
      throw new DatabaseError('Failed to remove managed patient', {
        originalError: error,
        userId,
        patientId,
      });
    }
  }

  // ====================== HEALTH PROFILE MANAGEMENT ======================

  async updateHealthProfile(userId: string | Types.ObjectId, healthProfile: Partial<IUser['healthProfile']>): Promise<boolean> {
    try {
      this.logger.debug('Updating health profile', { userId });
      const updateData: any = {};
      
      Object.keys(healthProfile).forEach(key => {
        updateData[`healthProfile.${key}`] = healthProfile[key as keyof IUser['healthProfile']];
      });
      updateData['metadata.updatedAt'] = new Date();

      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        updateData
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update health profile', error as Error);
      throw new DatabaseError('Failed to update health profile', {
        originalError: error,
        userId,
      });
    }
  }

  async findByBloodGroup(bloodGroup: string): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users by blood group', { bloodGroup });
      return await User.find({ 
        'healthProfile.bloodGroup': bloodGroup,
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users by blood group', error as Error);
      throw new DatabaseError('Failed to find users by blood group', {
        originalError: error,
        bloodGroup,
      });
    }
  }

  // ====================== STATUS MANAGEMENT ======================

  async activateUser(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Activating user', { userId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'status.isActive': true,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to activate user', error as Error);
      throw new DatabaseError('Failed to activate user', {
        originalError: error,
        userId,
      });
    }
  }

  async deactivateUser(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Deactivating user', { userId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'status.isActive': false,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to deactivate user', error as Error);
      throw new DatabaseError('Failed to deactivate user', {
        originalError: error,
        userId,
      });
    }
  }

  async verifyEmail(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Verifying user email', { userId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'status.emailVerified': true,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to verify user email', error as Error);
      throw new DatabaseError('Failed to verify user email', {
        originalError: error,
        userId,
      });
    }
  }

  async verifyPhone(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      this.logger.debug('Verifying user phone', { userId });
      const result = await User.updateOne(
        { 
          _id: userId,
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'status.phoneVerified': true,
          'metadata.updatedAt': new Date()
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to verify user phone', error as Error);
      throw new DatabaseError('Failed to verify user phone', {
        originalError: error,
        userId,
      });
    }
  }

  // ====================== SEARCH AND FILTERING ======================

  async searchUsers(query: {
    searchTerm?: string;
    role?: UserRole;
    userType?: UserType;
    organizationId?: string | Types.ObjectId;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<IUser[]> {
    try {
      this.logger.debug('Searching users', { query });
      
      const mongoQuery: any = {
        'metadata.deletedAt': { $exists: false }
      };

      if (query.searchTerm) {
        mongoQuery.$text = { $search: query.searchTerm };
      }

      if (query.role) {
        mongoQuery.role = query.role;
      }

      if (query.userType) {
        mongoQuery.userType = query.userType;
      }

      if (query.organizationId) {
        mongoQuery['employment.organizationId'] = query.organizationId;
      }

      if (query.isActive !== undefined) {
        mongoQuery['status.isActive'] = query.isActive;
      }

      if (query.isVerified !== undefined) {
        mongoQuery['status.isVerified'] = query.isVerified;
      }

      return await User.find(mongoQuery);
    } catch (error) {
      this.logger.error('Failed to search users', error as Error);
      throw new DatabaseError('Failed to search users', {
        originalError: error,
        query,
      });
    }
  }

  // ====================== ANALYTICS AND REPORTING ======================

  async getUserStats(organizationId?: string | Types.ObjectId): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    byRole: Record<UserRole, number>;
    byUserType: Record<UserType, number>;
  }> {
    try {
      this.logger.debug('Getting user statistics', { organizationId });
      
      const matchStage: any = {
        'metadata.deletedAt': { $exists: false }
      };

      if (organizationId) {
        matchStage['employment.organizationId'] = new Types.ObjectId(organizationId as string);
      }

      const stats = await User.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status.isActive', true] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$status.isActive', false] }, 1, 0] }
            },
            verified: {
              $sum: { $cond: [{ $eq: ['$status.isVerified', true] }, 1, 0] }
            },
            roles: { $push: '$role' },
            userTypes: { $push: '$userType' }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        roles: [],
        userTypes: []
      };

      // Count by role
      const byRole: Record<string, number> = {};
      result.roles.forEach((role: string) => {
        byRole[role] = (byRole[role] || 0) + 1;
      });

      // Count by user type
      const byUserType: Record<string, number> = {};
      result.userTypes.forEach((type: string) => {
        byUserType[type] = (byUserType[type] || 0) + 1;
      });

      return {
        total: result.total,
        active: result.active,
        inactive: result.inactive,
        verified: result.verified,
        byRole: byRole as Record<UserRole, number>,
        byUserType: byUserType as Record<UserType, number>
      };
    } catch (error) {
      this.logger.error('Failed to get user statistics', error as Error);
      throw new DatabaseError('Failed to get user statistics', {
        originalError: error,
        organizationId,
      });
    }
  }

  // ====================== GEOSPATIAL QUERIES ======================

  async findNearby(coordinates: [number, number], maxDistance: number): Promise<IUser[]> {
    try {
      this.logger.debug('Finding nearby users', { coordinates, maxDistance });
      return await User.find({
        'profile.address.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: maxDistance
          }
        },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find nearby users', error as Error);
      throw new DatabaseError('Failed to find nearby users', {
        originalError: error,
        coordinates,
        maxDistance,
      });
    }
  }

  // ====================== BULK OPERATIONS ======================

  async bulkUpdateStatus(userIds: (string | Types.ObjectId)[], isActive: boolean): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug('Bulk updating user status', { userIds: userIds.length, isActive });
      const result = await User.updateMany(
        { 
          _id: { $in: userIds },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          'status.isActive': isActive,
          'metadata.updatedAt': new Date()
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error('Failed to bulk update user status', error as Error);
      throw new DatabaseError('Failed to bulk update user status', {
        originalError: error,
        userIds: userIds.length,
        isActive,
      });
    }
  }

  async bulkAssignRole(userIds: (string | Types.ObjectId)[], role: UserRole): Promise<{ modifiedCount: number }> {
    try {
      this.logger.debug('Bulk assigning user role', { userIds: userIds.length, role });
      const result = await User.updateMany(
        { 
          _id: { $in: userIds },
          'metadata.deletedAt': { $exists: false }
        },
        { 
          role,
          'metadata.updatedAt': new Date()
        }
      );
      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      this.logger.error('Failed to bulk assign user role', error as Error);
      throw new DatabaseError('Failed to bulk assign user role', {
        originalError: error,
        userIds: userIds.length,
        role,
      });
    }
  }

  // ====================== ADVANCED QUERIES ======================

  async findUsersWithExpiredPasswords(daysOld: number): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users with expired passwords', { daysOld });
      const expiryDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      return await User.find({
        'metadata.updatedAt': { $lt: expiryDate },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users with expired passwords', error as Error);
      throw new DatabaseError('Failed to find users with expired passwords', {
        originalError: error,
        daysOld,
      });
    }
  }

  async findLockedAccounts(): Promise<IUser[]> {
    try {
      this.logger.debug('Finding locked user accounts');
      return await User.find({
        'authentication.lockedUntil': { $gt: new Date() },
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find locked accounts', error as Error);
      throw new DatabaseError('Failed to find locked accounts', {
        originalError: error,
      });
    }
  }

  async findUsersWithoutLogin(daysAgo: number): Promise<IUser[]> {
    try {
      this.logger.debug('Finding users without recent login', { daysAgo });
      const cutoffDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      return await User.find({
        $or: [
          { 'authentication.lastLogin': { $lt: cutoffDate } },
          { 'authentication.lastLogin': { $exists: false } }
        ],
        'metadata.deletedAt': { $exists: false }
      });
    } catch (error) {
      this.logger.error('Failed to find users without recent login', error as Error);
      throw new DatabaseError('Failed to find users without recent login', {
        originalError: error,
        daysAgo,
      });
    }
  }
}