import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../../../../shared/models/User.model.js';
import { DeviceModel } from '../../../../../shared/models/Device.model.js';
import { ResponseHelper } from '../../../../../shared/utils/response.helper.js';
import { DeviceHelper } from '../../../../../shared/utils/device.helper.js';
import { DeviceService } from '../../../../../shared/services/DeviceService.js';
import {
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  JWTPayload,
} from '../types/auth.types.js';
import { config } from '@/config/validator.js';

export class AuthController {
  static async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    try {
      const { email, password } = request.body;

      // Find user by email
      const user = await UserModel.findOne({
        email,
        'status.isActive': true,
        deletedAt: { $exists: false },
      }).select('+passwordHash');

      if (!user) {
        return ResponseHelper.sendUnauthorized(reply, 'Invalid email or password');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Increment login attempts
        user.authentication.loginAttempts++;
        if (user.authentication.loginAttempts >= 5) {
          user.authentication.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        }
        await user.save();

        return ResponseHelper.sendUnauthorized(reply, 'Invalid email or password');
      }

      // Check if account is locked
      if (user.authentication.lockedUntil && user.authentication.lockedUntil > new Date()) {
        return ResponseHelper.sendUnauthorized(
          reply,
          'Account is temporarily locked. Please try again later.'
        );
      }

      // Reset login attempts on successful login
      user.authentication.loginAttempts = 0;
      user.authentication.lockedUntil = undefined;
      user.authentication.lastLogin = new Date();

      // Generate tokens
      const tokenPayload: JWTPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        userType: user.userType,
      };

      const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET as string, {
        expiresIn: config.JWT_EXPIRES_IN,
      });

      const refreshToken = jwt.sign(tokenPayload, config.JWT_SECRET as string, {
        expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      });

      // Extract device information from request
      const deviceInfo = DeviceHelper.extractDeviceInfo(request);
      const locationInfo = DeviceHelper.extractLocationInfo(request);
      const deviceName = DeviceHelper.generateDeviceName(deviceInfo);
      const expiresAt = DeviceHelper.calculateExpiryDate(config.JWT_REFRESH_EXPIRES_IN as string);

      // Create or update device record
      const existingDevice = await DeviceModel.findOne({
        userId: user._id,
        'deviceInfo.userAgent': deviceInfo.userAgent,
        isActive: true
      });

      let device;
      if (existingDevice) {
        // Update existing device
        existingDevice.refreshToken = refreshToken;
        existingDevice.lastActive = new Date();
        existingDevice.expiresAt = expiresAt;
        existingDevice.location = locationInfo;
        device = await existingDevice.save();
      } else {
        // Check device limit and enforce if needed
        const deviceLimitExceeded = await DeviceService.checkDeviceLimit(user.userId, 5);
        if (deviceLimitExceeded) {
          await DeviceService.enforceDeviceLimit(user.userId, 5);
        }

        // Create new device record
        device = new DeviceModel({
          userId: user._id,
          deviceInfo,
          location: locationInfo,
          refreshToken,
          deviceName,
          expiresAt,
          isActive: true,
          isTrusted: false
        });
        await device.save();
      }

      // Debug user data
      console.log('User found:', {
        userId: user.userId,
        email: user.email,
        username: user.username,
        role: user.role,
        userType: user.userType,
        hasProfile: !!user.profile,
        profileData: user.profile,
        hasPermissions: !!user.permissions,
      });

      // Prepare response with error handling
      let fullName = 'Unknown User';
      try {
        fullName = user.getFullName();
      } catch (error) {
        console.error('Error getting full name:', error);
        fullName = user.username || user.email;
      }

      // Create response directly as plain object
      const responseData = {
        user: {
          id: user.userId,
          email: user.email,
          name: fullName,
          username: user.username,
          role: user.role,
          userType: user.userType,
          profile: {
            firstName: user.profile?.firstName || 'Unknown',
            lastName: user.profile?.lastName || 'User',
            mobileNumber: user.profile?.mobileNumber,
          },
          employment: user.employment
            ? {
                organizationId: user.employment.organizationId?.toString() || '',
                designation: user.employment.designation || '',
                department: user.employment.department || '',
              }
            : undefined,
          permissions: {
            canCreateCases: user.permissions?.canCreateCases || false,
            canEditCases: user.permissions?.canEditCases || false,
            canDeleteCases: user.permissions?.canDeleteCases || false,
            canCreateReports: user.permissions?.canCreateReports || false,
            canApproveReports: user.permissions?.canApproveReports || false,
            canManageUsers: user.permissions?.canManageUsers || false,
            canViewAnalytics: user.permissions?.canViewAnalytics || false,
            canManageInventory: user.permissions?.canManageInventory || false,
          },
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      };

      console.log('Prepared response data:', JSON.stringify(responseData, null, 2));

      // Try direct response without ResponseHelper
      const directResponse = {
        success: true,
        statusCode: 200,
        message: 'Login successful',
        data: responseData,
      };

      console.log('Direct response:', JSON.stringify(directResponse, null, 2));

      return reply.code(200).send(directResponse);
    } catch (error) {
      console.error('Login error:', error);
      return ResponseHelper.sendInternalError(reply, 'Login failed');
    }
  }

  static async refresh(
    request: FastifyRequest<{ Body: RefreshTokenRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { refreshToken } = request.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET as string) as JWTPayload;

      // Find device with the refresh token
      const device = await DeviceModel.findOne({
        refreshToken,
        isActive: true
      }).populate('userId');

      if (!device || device.isExpired()) {
        return ResponseHelper.sendUnauthorized(reply, 'Invalid or expired refresh token');
      }

      // Get user data
      const user = await UserModel.findOne({
        userId: decoded.userId,
        'status.isActive': true,
        deletedAt: { $exists: false },
      });

      if (!user) {
        // Clean up orphaned device
        await device.revoke();
        return ResponseHelper.sendUnauthorized(reply, 'User not found');
      }

      // Update device last activity
      await device.updateLastActive();

      // Generate new access token
      const tokenPayload: JWTPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        userType: user.userType,
      };

      const accessToken = jwt.sign(tokenPayload, config.JWT_SECRET as string, {
        expiresIn: config.JWT_EXPIRES_IN,
      });

      const response = {
        accessToken,
        expiresIn: 3600,
      };

      return ResponseHelper.sendSuccess(reply, response, 'Token refreshed successfully');
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return ResponseHelper.sendUnauthorized(reply, 'Invalid refresh token');
      }
      console.error('Token refresh error:', error);
      return ResponseHelper.sendInternalError(reply, 'Token refresh failed');
    }
  }

  static async logout(
    request: FastifyRequest<{ Headers: { refreshToken: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { refreshToken } = request.headers;

      if (!refreshToken) {
        return ResponseHelper.sendBadRequest(reply, 'Refresh token is required');
      }

      // Find and delete the device record
      const device = await DeviceModel.findOne({ refreshToken, isActive: true });
      
      if (device) {
        await device.revoke(); // This deletes the device record
      }

      return ResponseHelper.sendSuccess(reply, undefined, 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      return ResponseHelper.sendInternalError(reply, 'Logout failed');
    }
  }

  static async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // User is set by auth middleware
      const userId = request.user?.userId;

      if (!userId) {
        return ResponseHelper.sendUnauthorized(reply, 'Authentication required');
      }

      const user = await UserModel.findOne({
        userId,
        'status.isActive': true,
        deletedAt: { $exists: false },
      });

      if (!user) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      const response = {
        userId: user.userId,
        username: user.username,
        email: user.email,
        userType: user.userType,
        role: user.role,
        profile: user.profile,
        employment: user.employment,
        permissions: user.permissions,
        status: user.status,
        preferences: user.preferences,
      };

      return ResponseHelper.sendSuccess(reply, response, 'User profile retrieved successfully');
    } catch (error) {
      console.error('Get profile error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to retrieve user profile');
    }
  }

  static async changePassword(
    request: FastifyRequest<{ Body: ChangePasswordRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user?.userId;

      if (!userId) {
        return ResponseHelper.sendUnauthorized(reply, 'Authentication required');
      }

      const user = await UserModel.findOne({
        userId,
        'status.isActive': true,
        deletedAt: { $exists: false },
      }).select('+passwordHash');

      if (!user) {
        return ResponseHelper.sendNotFound(reply, 'User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return ResponseHelper.sendBadRequest(reply, 'Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.passwordHash = hashedPassword;
      await user.save();

      return ResponseHelper.sendSuccess(reply, undefined, 'Password changed successfully');
    } catch (error) {
      console.error('Change password error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to change password');
    }
  }

  static async forgotPassword(
    request: FastifyRequest<{ Body: ForgotPasswordRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { email } = request.body;

      const user = await UserModel.findOne({
        email,
        'status.isActive': true,
        deletedAt: { $exists: false },
      });

      // Always return success for security (don't reveal if email exists)
      if (!user) {
        return ResponseHelper.sendSuccess(
          reply,
          undefined,
          'If the email exists, a password reset link has been sent'
        );
      }

      // Generate reset token (implement this based on your email service)
      const resetToken = jwt.sign({ userId: user.userId }, config.JWT_SECRET as string, {
        expiresIn: config.JWT_EXPIRES_IN,
      });

      // TODO: Send email with reset token
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      console.log(`Password reset token for ${email}: ${resetToken}`); // For development

      return ResponseHelper.sendSuccess(
        reply,
        undefined,
        'If the email exists, a password reset link has been sent'
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to process password reset request');
    }
  }

  static async resetPassword(
    request: FastifyRequest<{ Body: ResetPasswordRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { email, resetToken, newPassword } = request.body;

      // Verify reset token
      const decoded = jwt.verify(resetToken, config.JWT_SECRET as string) as JWTPayload;

      const user = await UserModel.findOne({
        userId: decoded.userId,
        email,
        'status.isActive': true,
        deletedAt: { $exists: false },
      }).select('+passwordHash');

      if (!user) {
        return ResponseHelper.sendBadRequest(reply, 'Invalid reset token or email');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and revoke all devices
      user.passwordHash = hashedPassword;
      user.authentication.loginAttempts = 0;
      user.authentication.lockedUntil = undefined;
      await user.save();

      // Revoke all devices for security
      await DeviceModel.deleteMany({ userId: user._id });

      return ResponseHelper.sendSuccess(reply, undefined, 'Password reset successfully');
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return ResponseHelper.sendBadRequest(reply, 'Invalid or expired reset token');
      }
      console.error('Reset password error:', error);
      return ResponseHelper.sendInternalError(reply, 'Failed to reset password');
    }
  }
}
