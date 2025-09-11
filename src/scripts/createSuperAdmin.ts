#!/usr/bin/env node

/**
 * SuperAdmin User Creation Script
 *
 * Creates a superAdmin user for lab onboarding and system administration.
 * This user has all permissions and bypasses permission checks.
 *
 * Usage: npm run seed:superadmin
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../shared/models/User.model.js';
import { UserType, UserRole, Gender } from '../shared/types/enums.js';
import { database } from '../config/database.js';
import { generateId } from '../shared/utils/idGenerator.js';

// SuperAdmin user credentials
const SUPERADMIN_DATA = {
  email: 'admin@labloop.com',
  password: 'Test@123',
  firstName: 'Super',
  lastName: 'Admin',
  username: 'superadmin',
};

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // High security for admin account
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Create superAdmin user with all permissions
 */
async function createSuperAdminUser() {
  try {
    console.log('🚀 Starting SuperAdmin user creation...');

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      email: SUPERADMIN_DATA.email,
    });

    if (existingUser) {
      console.log('⚠️  SuperAdmin user already exists with email:', SUPERADMIN_DATA.email);
      console.log('✅ SuperAdmin user ID:', existingUser.userId);
      return existingUser;
    }

    // Hash the password
    const passwordHash = await hashPassword(SUPERADMIN_DATA.password);
    console.log('🔐 Password hashed successfully');

    // Generate userId manually
    const userId = await generateId('USR');
    console.log('🆔 Generated User ID:', userId);

    // Create superAdmin user data
    const superAdminData = {
      userId,
      username: SUPERADMIN_DATA.username,
      email: SUPERADMIN_DATA.email,
      passwordHash,
      userType: UserType.B2B,
      role: UserRole.ADMIN, // Using ADMIN role with full permissions

      // Profile information
      profile: {
        firstName: SUPERADMIN_DATA.firstName,
        lastName: SUPERADMIN_DATA.lastName,
        mobileNumber: '+15550000000', // Valid E.164 format
        gender: Gender.OTHER,
        address: {
          street: 'LabLoop Headquarters',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
        },
      },

      // Health profile (optional for admin)
      healthProfile: {
        emergencyContact: {
          name: 'System Administrator',
          phone: '+1-555-0001',
          relationship: 'System Contact',
        },
      },

      // No employment/organization assignment - system level admin
      employment: undefined,

      // Full permissions for superAdmin
      permissions: {
        canCreateCases: true,
        canEditCases: true,
        canDeleteCases: true,
        canCreateReports: true,
        canApproveReports: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageInventory: true,
      },

      // Authentication settings
      authentication: {
        twoFactorEnabled: false, // Can be enabled later
        loginAttempts: 0,
        lastLogin: undefined,
        refreshToken: undefined,
      },

      // Status settings
      status: {
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
      },

      // Preferences
      preferences: {
        language: 'en',
        timezone: 'Asia/Kolkata',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },

      // No managed patients (system admin doesn't manage specific patients)
      managedPatients: [],

      // Audit fields
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      createdBy: undefined, // Self-created system user
    };

    // Create the user
    const superAdmin = new UserModel(superAdminData);
    const savedUser = await superAdmin.save();

    console.log('✅ SuperAdmin user created successfully!');
    console.log('📧 Email:', savedUser.email);
    console.log('🆔 User ID:', savedUser.userId);
    console.log('🔑 Role:', savedUser.role);
    console.log('👤 Full Name:', `${savedUser.profile.firstName} ${savedUser.profile.lastName}`);
    console.log('🔐 Password: Test@123 (remember to change in production!)');

    return savedUser;
  } catch (error) {
    console.error('❌ Error creating SuperAdmin user:', error);

    // Provide helpful error messages
    if (error instanceof mongoose.Error.ValidationError) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach((key) => {
        console.error(`- ${key}: ${error.errors[key]?.message}`);
      });
    } else if (error instanceof Error) {
      console.error('Error message:', error.message);
    }

    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await database.connect();
    console.log('✅ Database connected successfully');

    // Create superAdmin user
    await createSuperAdminUser();

    console.log('\n🎉 SuperAdmin user setup completed!');
    console.log('🚀 You can now use these credentials to login:');
    console.log('   Email: admin@labloop.com');
    console.log('   Password: Test@123');
    console.log('\n💡 This superAdmin user can:');
    console.log('   ✓ Onboard new labs and organizations');
    console.log('   ✓ Manage all users and permissions');
    console.log('   ✓ Access all system functionality');
    console.log('   ✓ View analytics and reports');
    console.log('   ✓ Bypass permission restrictions');
  } catch (error) {
    console.error('\n💥 Failed to create SuperAdmin user:', error);
    process.exit(1);
  } finally {
    // Clean up database connection
    try {
      await database.disconnect();
      console.log('\n🔌 Database connection closed');
    } catch (disconnectError) {
      console.error('Error closing database connection:', disconnectError);
    }
  }
}

// Execute the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { createSuperAdminUser };
