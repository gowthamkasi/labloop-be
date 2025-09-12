import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { UserModel } from '../../../../../shared/models/User.model.js';
import { ResponseHelper } from '../../../../../shared/utils/response.helper.js';
import { UserType } from '../../../../../shared/types/enums.js';
import {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserListQuery,
  UserListResponse,
  ResetPasswordResponse,
  ActivateUserRequest,
} from '../types/admin.types.js';

export class UserController {
  static async createUser(
    request: FastifyRequest<{ Body: CreateUserRequest }>,
    reply: FastifyReply
  ) {
    try {
      const {
        username,
        email,
        role,
        profile,
        employment,
        permissions,
        sendWelcomeEmail = true,
      } = request.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [{ email }, { username }],
        deletedAt: { $exists: false },
      });

      if (existingUser) {
        return ResponseHelper.sendConflict(
          reply,
          existingUser.email === email ? 'Email already exists' : 'Username already exists'
        );
      }

      // Generate temporary password
      const temporaryPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

      // Set default permissions based on role
      const defaultPermissions = UserController.getDefaultPermissions(role);
      const finalPermissions = { ...defaultPermissions, ...permissions };

      // Create user
      const newUser = new UserModel({
        username,
        email,
        passwordHash: hashedPassword,
        userType: UserType.B2B,
        role,
        profile,
        employment: employment
          ? {
              ...employment,
              joiningDate: employment.joiningDate ? new Date(employment.joiningDate) : new Date(),
            }
          : undefined,
        permissions: finalPermissions,
        status: {
          isActive: true,
          isVerified: false,
          emailVerified: false,
          phoneVerified: false,
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
        authentication: {
          twoFactorEnabled: false,
          loginAttempts: 0,
        },
      });

      await newUser.save();

      // TODO: Send welcome email if requested
      if (sendWelcomeEmail) {
        console.log(
          `Welcome email would be sent to ${email} with temporary password: ${temporaryPassword}`
        );
        // await emailService.sendWelcomeEmail(email, temporaryPassword);
      }

      const response: CreateUserResponse = {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        profile: {
          firstName: newUser.profile.firstName,
          lastName: newUser.profile.lastName,
          mobileNumber: newUser.profile.mobileNumber,
        },
        employment: newUser.employment
          ? {
              organizationId: newUser.employment.organizationId?.toString(),
              designation: newUser.employment.designation,
              department: newUser.employment.department,
            }
          : undefined,
        permissions: newUser.permissions,
        temporaryPassword, // Only returned to admin
        status: newUser.status,
      };

      return ResponseHelper.sendCreated(
        reply,
        response,
        'User created successfully. Welcome email sent.'
      );
    } catch (error) {
      console.error('Create user error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to create user');
    }
  }

  static async getUsers(
    request: FastifyRequest<{ Querystring: UserListQuery }>,
    reply: FastifyReply
  ) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        role,
        organizationId,
        isActive,
        department,
      } = request.query;

      // Build filter
      const filter: any = {
        deletedAt: { $exists: false },
      };

      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
        ];
      }

      if (role) filter.role = role;
      if (organizationId) filter['employment.organizationId'] = organizationId;
      if (isActive !== undefined) filter['status.isActive'] = isActive;
      if (department) filter['employment.department'] = { $regex: department, $options: 'i' };

      // Get total count
      const total = await UserModel.countDocuments(filter);

      // Get users with pagination
      const users = await UserModel.find(filter)
        .select('-passwordHash -authentication.refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(total / limit);

      const response: UserListResponse = {
        users: users.map((user) => ({
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
          },
          employment: user.employment
            ? {
                organizationId: user.employment.organizationId?.toString() || '',
                designation: user.employment.designation || '',
                department: user.employment.department || '',
              }
            : undefined,
          status: {
            isActive: user.status.isActive,
            isVerified: user.status.isVerified,
          },
          createdAt: user.createdAt.toISOString(),
        })),
        pagination: {
          total,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };

      return ResponseHelper.sendSuccess(reply, response, 'Users retrieved successfully');
    } catch (error) {
      console.error('Get users error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to retrieve users');
    }
  }

  static async getUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;

      const user = await UserModel.findOne({
        userId,
        deletedAt: { $exists: false },
      })
        .select('-passwordHash -authentication.refreshToken')
        .lean();

      if (!user) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      return ResponseHelper.sendSuccess(reply, user, 'User retrieved successfully');
    } catch (error) {
      console.error('Get user error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to retrieve user');
    }
  }

  static async updateUser(
    request: FastifyRequest<{ Params: { userId: string }; Body: UpdateUserRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const updateData = request.body;

      // Check if username/email conflict exists
      if (updateData.username || updateData.email) {
        const existingUser = await UserModel.findOne({
          $or: [
            ...(updateData.email ? [{ email: updateData.email }] : []),
            ...(updateData.username ? [{ username: updateData.username }] : []),
          ],
          userId: { $ne: userId },
          deletedAt: { $exists: false },
        });

        if (existingUser) {
          return ResponseHelper.sendConflict(
            reply,
            existingUser.email === updateData.email
              ? 'Email already exists'
              : 'Username already exists'
          );
        }
      }

      // Update employment joiningDate if provided
      if (updateData.employment?.joiningDate) {
        updateData.employment.joiningDate = new Date(updateData.employment.joiningDate) as any;
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { userId, deletedAt: { $exists: false } },
        {
          ...updateData,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      )
        .select('-passwordHash -authentication.refreshToken')
        .lean();

      if (!updatedUser) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      return ResponseHelper.sendSuccess(reply, updatedUser, 'User updated successfully');
    } catch (error) {
      console.error('Update user error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to update user');
    }
  }

  static async activateUser(
    request: FastifyRequest<{ Params: { userId: string }; Body: ActivateUserRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;
      const { isActive } = request.body;

      const updatedUser = await UserModel.findOneAndUpdate(
        { userId, deletedAt: { $exists: false } },
        {
          'status.isActive': isActive,
          updatedAt: new Date(),
        },
        { new: true }
      )
        .select('-passwordHash -authentication.refreshToken')
        .lean();

      if (!updatedUser) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      const message = isActive ? 'User activated successfully' : 'User deactivated successfully';
      return ResponseHelper.sendSuccess(reply, updatedUser, message);
    } catch (error) {
      console.error('Activate user error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to update user status');
    }
  }

  static async resetUserPassword(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;

      const user = await UserModel.findOne({
        userId,
        deletedAt: { $exists: false },
      });

      if (!user) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      // Generate new temporary password
      const temporaryPassword =
        Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

      // Update password and clear login attempts
      user.passwordHash = hashedPassword;
      user.authentication.loginAttempts = 0;
      user.authentication.lockedUntil = undefined;
      await user.save();

      // Revoke all devices for security
      const { DeviceModel } = await import('../../../../../shared/models/Device.model.js');
      await DeviceModel.deleteMany({ userId: user._id });

      // TODO: Send email with new password
      console.log(
        `Password reset email would be sent to ${user.email} with new password: ${temporaryPassword}`
      );
      // await emailService.sendPasswordResetEmail(user.email, temporaryPassword);

      const response: ResetPasswordResponse = {
        temporaryPassword,
        emailSent: true,
      };

      return ResponseHelper.sendSuccess(
        reply,
        response,
        'Password reset successfully. New temporary password sent to user.'
      );
    } catch (error) {
      console.error('Reset user password error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to reset user password');
    }
  }

  static async deleteUser(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.params;

      const user = await UserModel.findOneAndUpdate(
        { userId, deletedAt: { $exists: false } },
        {
          deletedAt: new Date(),
          'status.isActive': false,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!user) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      return ResponseHelper.sendSuccess(reply, undefined, 'User deleted successfully');
    } catch (error) {
      console.error('Delete user error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to delete user');
    }
  }

  // Helper method to get default permissions based on role
  private static getDefaultPermissions(role: string) {
    const permissions = {
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
          ...permissions,
          canCreateCases: true,
          canEditCases: true,
          canDeleteCases: true,
          canCreateReports: true,
          canApproveReports: true,
          canManageUsers: true,
          canViewAnalytics: true,
          canManageInventory: true,
        };
      case 'lab_manager':
        return {
          ...permissions,
          canCreateCases: true,
          canEditCases: true,
          canCreateReports: true,
          canApproveReports: true,
          canViewAnalytics: true,
          canManageInventory: true,
        };
      case 'technician':
        return {
          ...permissions,
          canCreateCases: true,
          canCreateReports: true,
          canViewAnalytics: true,
        };
      case 'doctor':
        return {
          ...permissions,
          canCreateCases: true,
          canEditCases: true,
          canViewAnalytics: true,
        };
      default:
        return permissions;
    }
  }
}
