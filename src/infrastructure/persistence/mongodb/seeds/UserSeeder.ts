/**
 * User Seeder for LabLoop Healthcare System
 * Seeds initial user data for development and testing
 */

import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { IUser, UserType, UserRole } from '@/application/types/index.js';
import { ILogger } from '@/shared/utils/Logger.js';

export interface ISeeder {
  name: string;
  seed(): Promise<void>;
  clear(): Promise<void>;
}

export class UserSeeder implements ISeeder {
  public readonly name = 'UserSeeder';
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async seed(): Promise<void> {
    this.logger.info('Seeding users...');

    try {
      // Check if users already exist
      const existingUsersCount = await User.countDocuments();
      if (existingUsersCount > 0) {
        this.logger.info('Users already exist, skipping seeding');
        return;
      }

      const users = await this.generateUsers();
      
      // Insert users in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        await User.insertMany(batch, { ordered: false });
        this.logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
      }

      this.logger.info(`Successfully seeded ${users.length} users`);
    } catch (error) {
      this.logger.error('Failed to seed users', error as Error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    this.logger.info('Clearing users...');

    try {
      const result = await User.deleteMany({});
      this.logger.info(`Cleared ${result.deletedCount} users`);
    } catch (error) {
      this.logger.error('Failed to clear users', error as Error);
      throw error;
    }
  }

  private async generateUsers(): Promise<Partial<IUser>[]> {
    const users: Partial<IUser>[] = [];

    // Admin users
    users.push(await this.createUser({
      username: 'admin',
      email: 'admin@labloop.com',
      password: 'Admin@123',
      userType: 'b2b',
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        mobileNumber: '+919876543210',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        }
      }
    }));

    users.push(await this.createUser({
      username: 'labadmin',
      email: 'labadmin@labloop.com',
      password: 'LabAdmin@123',
      userType: 'b2b',
      role: 'labManager',
      profile: {
        firstName: 'Lab',
        lastName: 'Manager',
        mobileNumber: '+919876543211',
        address: {
          city: 'Delhi',
          state: 'Delhi',
          country: 'India'
        }
      }
    }));

    // Lab staff users
    const labStaffRoles: UserRole[] = ['technician', 'collectionAgent', 'receptionist', 'qualityController', 'labAssistant'];
    const labStaffNames = [
      { firstName: 'Priya', lastName: 'Sharma' },
      { firstName: 'Rajesh', lastName: 'Kumar' },
      { firstName: 'Anita', lastName: 'Singh' },
      { firstName: 'Vikram', lastName: 'Patel' },
      { firstName: 'Kavya', lastName: 'Reddy' }
    ];

    for (let i = 0; i < labStaffRoles.length; i++) {
      const role = labStaffRoles[i];
      const name = labStaffNames[i];
      
      users.push(await this.createUser({
        username: role.toLowerCase(),
        email: `${role.toLowerCase()}@labloop.com`,
        password: 'Staff@123',
        userType: 'b2b',
        role,
        profile: {
          firstName: name.firstName,
          lastName: name.lastName,
          mobileNumber: `+91987654321${i + 2}`,
          address: {
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
          }
        },
        healthProfile: {
          bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i],
          height: 160 + Math.random() * 20,
          weight: 60 + Math.random() * 20,
        }
      }));
    }

    // Consumer users
    const consumerNames = [
      { firstName: 'Amit', lastName: 'Gupta' },
      { firstName: 'Sunita', lastName: 'Agarwal' },
      { firstName: 'Rahul', lastName: 'Verma' },
      { firstName: 'Deepika', lastName: 'Joshi' },
      { firstName: 'Arjun', lastName: 'Nair' }
    ];

    for (let i = 0; i < consumerNames.length; i++) {
      const name = consumerNames[i];
      
      users.push(await this.createUser({
        username: `consumer${i + 1}`,
        email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@email.com`,
        password: 'Consumer@123',
        userType: 'b2c',
        role: 'consumer',
        profile: {
          firstName: name.firstName,
          lastName: name.lastName,
          dateOfBirth: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          mobileNumber: `+91987654322${i}`,
          address: {
            street: `${i + 1}23, Sample Street`,
            city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][i],
            state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][i],
            zipCode: `40000${i}`,
            country: 'India'
          }
        },
        healthProfile: {
          bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i],
          height: 155 + Math.random() * 25,
          weight: 55 + Math.random() * 25,
          allergies: i === 0 ? ['Peanuts', 'Dust'] : [],
          medications: i === 1 ? ['Metformin'] : [],
        }
      }));
    }

    // Family manager users
    for (let i = 0; i < 2; i++) {
      users.push(await this.createUser({
        username: `familymanager${i + 1}`,
        email: `family${i + 1}@email.com`,
        password: 'Family@123',
        userType: 'b2c',
        role: 'familyManager',
        profile: {
          firstName: `Family`,
          lastName: `Manager ${i + 1}`,
          dateOfBirth: new Date(1975 + i * 5, 5, 15),
          gender: i % 2 === 0 ? 'female' : 'male',
          mobileNumber: `+919876543230${i}`,
          address: {
            city: 'Pune',
            state: 'Maharashtra',
            zipCode: '411001',
            country: 'India'
          }
        }
      }));
    }

    return users;
  }

  private async createUser(userData: {
    username: string;
    email: string;
    password: string;
    userType: UserType;
    role: UserRole;
    profile: any;
    healthProfile?: any;
  }): Promise<Partial<IUser>> {
    const passwordHash = await bcrypt.hash(userData.password, 12);

    return {
      userId: await this.generateUserId(),
      username: userData.username,
      email: userData.email,
      passwordHash,
      userType: userData.userType,
      role: userData.role,
      profile: userData.profile,
      healthProfile: userData.healthProfile || {},
      permissions: this.getDefaultPermissions(userData.role),
      authentication: {
        twoFactorEnabled: false,
        loginAttempts: 0,
      },
      status: {
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      },
      preferences: {
        language: 'en',
        timezone: 'Asia/Kolkata',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  private async generateUserId(): Promise<string> {
    let userId: string;
    let exists: boolean;

    do {
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      userId = `USR${timestamp}${random}`;
      exists = await User.exists({ userId });
    } while (exists);

    return userId;
  }

  private getDefaultPermissions(role: UserRole): any {
    const basePermissions = {
      canCreateCases: false,
      canEditCases: false,
      canDeleteCases: false,
      canCreateReports: false,
      canApproveReports: false,
      canManageUsers: false,
      canViewAnalytics: false,
      canManageInventory: false,
    };

    switch (role) {
      case 'admin':
        return {
          canCreateCases: true,
          canEditCases: true,
          canDeleteCases: true,
          canCreateReports: true,
          canApproveReports: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canManageInventory: true,
        };
      case 'labManager':
        return {
          ...basePermissions,
          canCreateCases: true,
          canEditCases: true,
          canCreateReports: true,
          canApproveReports: true,
          canViewAnalytics: true,
          canManageInventory: true,
        };
      case 'technician':
        return {
          ...basePermissions,
          canCreateReports: true,
          canViewAnalytics: true,
        };
      case 'qualityController':
        return {
          ...basePermissions,
          canApproveReports: true,
          canViewAnalytics: true,
        };
      case 'consumer':
      case 'familyManager':
        return {
          ...basePermissions,
          canCreateCases: true,
        };
      default:
        return basePermissions;
    }
  }
}