import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../../../../../shared/models/User.model.js';
import { ResponseHelper } from '../../../../../shared/utils/response.helper.js';
import {
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  JWTPayload,
  LoginResponse,
} from '../types/auth.types.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

export class AuthController {
  static async login(request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) {
    try {
      const { email, password, rememberMe } = request.body;

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
        await user.authentication.loginAttempts++;
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

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const refreshToken = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
        expiresIn: rememberMe ? '30d' : JWT_REFRESH_EXPIRES_IN,
      });

      // Store refresh token
      user.authentication.refreshToken = refreshToken;
      await user.save();

      // Prepare response
      const response: LoginResponse = {
        user: {
          id: user.userId,
          email: user.email,
          name: user.getFullName(),
          username: user.username,
          role: user.role,
          userType: user.userType,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            ...(user.profile.mobileNumber && { mobileNumber: user.profile.mobileNumber }),
          },
          employment: user.employment
            ? {
                organizationId: user.employment.organizationId?.toString() || '',
                designation: user.employment.designation || '',
                department: user.employment.department || '',
              }
            : undefined,
          permissions: user.permissions,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour in seconds
        },
      };

      return ResponseHelper.sendSuccess(reply, response, 'Login successful');
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
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;

      // Find user and verify refresh token
      const user = await UserModel.findOne({
        userId: decoded.userId,
        'authentication.refreshToken': refreshToken,
        'status.isActive': true,
        deletedAt: { $exists: false },
      });

      if (!user) {
        return ResponseHelper.sendUnauthorized(reply, 'Invalid refresh token');
      }

      // Generate new access token
      const tokenPayload: JWTPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        userType: user.userType,
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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

  static async logout(request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) {
    try {
      const { refreshToken } = request.body;

      // Find user and clear refresh token
      await UserModel.findOneAndUpdate(
        { 'authentication.refreshToken': refreshToken },
        { $unset: { 'authentication.refreshToken': 1 } }
      );

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
      const resetToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

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
      const decoded = jwt.verify(resetToken, JWT_SECRET) as JWTPayload;

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

      // Update password and clear any existing refresh tokens
      user.passwordHash = hashedPassword;
      user.authentication.refreshToken = undefined;
      user.authentication.loginAttempts = 0;
      user.authentication.lockedUntil = undefined;
      await user.save();

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
