import { DeviceModel } from '../models/Device.model.js';
import { Types } from 'mongoose';

export class DeviceService {
  /**
   * Clean up expired devices
   */
  static async cleanupExpiredDevices(): Promise<number> {
    try {
      const result = await DeviceModel.deleteMany({
        expiresAt: { $lt: new Date() },
        isActive: true
      });
      
      console.log(`Cleaned up ${result.deletedCount} expired devices`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired devices:', error);
      return 0;
    }
  }

  /**
   * Clean up inactive devices (not used for X days)
   */
  static async cleanupInactiveDevices(daysInactive: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const result = await DeviceModel.deleteMany({
        lastActive: { $lt: cutoffDate },
        isActive: true
      });
      
      console.log(`Cleaned up ${result.deletedCount} inactive devices (${daysInactive}+ days)`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up inactive devices:', error);
      return 0;
    }
  }

  /**
   * Get user's active devices
   */
  static async getUserDevices(userId: string) {
    try {
      const devices = await DeviceModel.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).select('-refreshToken').sort({ lastActive: -1 });

      return devices.map(device => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceInfo: device.deviceInfo,
        location: device.location,
        isTrusted: device.isTrusted,
        firstLogin: device.firstLogin,
        lastActive: device.lastActive,
        expiresAt: device.expiresAt
      }));
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  }

  /**
   * Revoke specific device
   */
  static async revokeDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await DeviceModel.deleteOne({
        deviceId,
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error revoking device:', error);
      return false;
    }
  }

  /**
   * Revoke all devices for a user except current one
   */
  static async revokeAllOtherDevices(userId: string, currentDeviceId: string): Promise<number> {
    try {
      const result = await DeviceModel.deleteMany({
        userId: new Types.ObjectId(userId),
        deviceId: { $ne: currentDeviceId },
        isActive: true
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error revoking other devices:', error);
      return 0;
    }
  }

  /**
   * Revoke all devices for a user
   */
  static async revokeAllDevices(userId: string): Promise<number> {
    try {
      const result = await DeviceModel.deleteMany({
        userId: new Types.ObjectId(userId),
        isActive: true
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error revoking all devices:', error);
      return 0;
    }
  }

  /**
   * Update device name
   */
  static async updateDeviceName(userId: string, deviceId: string, newName: string): Promise<boolean> {
    try {
      const result = await DeviceModel.updateOne(
        {
          deviceId,
          userId: new Types.ObjectId(userId),
          isActive: true
        },
        { 
          deviceName: newName,
          updatedAt: new Date()
        }
      );

      return result.matchedCount === 1;
    } catch (error) {
      console.error('Error updating device name:', error);
      return false;
    }
  }

  /**
   * Mark device as trusted
   */
  static async trustDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await DeviceModel.updateOne(
        {
          deviceId,
          userId: new Types.ObjectId(userId),
          isActive: true
        },
        { 
          isTrusted: true,
          updatedAt: new Date()
        }
      );

      return result.matchedCount === 1;
    } catch (error) {
      console.error('Error trusting device:', error);
      return false;
    }
  }

  /**
   * Get device statistics for a user
   */
  static async getDeviceStats(userId: string) {
    try {
      const stats = await DeviceModel.aggregate([
        { 
          $match: { 
            userId: new Types.ObjectId(userId),
            isActive: true 
          } 
        },
        {
          $group: {
            _id: null,
            totalDevices: { $sum: 1 },
            trustedDevices: { 
              $sum: { $cond: ['$isTrusted', 1, 0] } 
            },
            deviceTypes: { $push: '$deviceInfo.type' },
            lastActive: { $max: '$lastActive' },
            oldestDevice: { $min: '$firstLogin' }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalDevices: 0,
          trustedDevices: 0,
          deviceTypes: [],
          lastActive: null,
          oldestDevice: null
        };
      }

      const result = stats[0];
      
      // Count device types
      const typeCount = result.deviceTypes.reduce((acc: Record<string, number>, type: string) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDevices: result.totalDevices,
        trustedDevices: result.trustedDevices,
        deviceTypeBreakdown: typeCount,
        lastActive: result.lastActive,
        oldestDevice: result.oldestDevice
      };
    } catch (error) {
      console.error('Error getting device stats:', error);
      return null;
    }
  }

  /**
   * Check if user has reached device limit
   */
  static async checkDeviceLimit(userId: string, maxDevices: number = 10): Promise<boolean> {
    try {
      const deviceCount = await DeviceModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      return deviceCount >= maxDevices;
    } catch (error) {
      console.error('Error checking device limit:', error);
      return false;
    }
  }

  /**
   * Clean up oldest devices if limit exceeded
   */
  static async enforceDeviceLimit(userId: string, maxDevices: number = 10): Promise<number> {
    try {
      const devices = await DeviceModel.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).sort({ lastActive: 1 }); // Oldest first

      if (devices.length <= maxDevices) {
        return 0;
      }

      const devicesToRemove = devices.slice(0, devices.length - maxDevices);
      const deviceIds = devicesToRemove.map(d => d._id);

      const result = await DeviceModel.deleteMany({
        _id: { $in: deviceIds }
      });

      console.log(`Enforced device limit: removed ${result.deletedCount} oldest devices for user ${userId}`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error enforcing device limit:', error);
      return 0;
    }
  }
}