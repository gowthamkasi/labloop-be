/**
 * Login Use Case
 * Handles user authentication and session management
 */

import { inject, injectable } from 'inversify';
import { TYPES } from '@/config/Container.js';
import { IUserRepository } from '@/application/interfaces/repositories/IUserRepository.js';
import { UserAggregate } from '@/domain/user/UserAggregate.js';
import { PasswordService } from '@/domain/user/services/PasswordService.js';
import { 
  InvalidCredentialsError, 
  AccountLockedError, 
  UnauthorizedAccessError,
  HipaaComplianceError 
} from '@/domain/user/exceptions/index.js';
import { UserLoginEvent } from '@/domain/user/events/index.js';
import { ILogger } from '@/shared/utils/Logger.js';

export interface LoginRequest {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceName?: string;
  platform?: 'web' | 'mobile' | 'ios' | 'android';
}

export interface LoginResponse {
  success: boolean;
  user: {
    _id: string;
    username: string;
    email: string;
    role: string;
    profile: any;
    labId?: string;
    labName?: string;
    hospitalId?: string;
    hospitalName?: string;
    permissions: any;
    needsPasswordReset: boolean;
    needsHipaaTraining: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message: string;
}\n\nexport interface ITokenService {\n  generateAccessToken(userId: string, role: string): string;\n  generateRefreshToken(userId: string): string;\n  getTokenExpiry(): number;\n}\n\n@injectable()\nexport class LoginUseCase {\n  constructor(\n    @inject(TYPES.UserRepository) private userRepository: IUserRepository,\n    @inject(TYPES.PasswordService) private passwordService: PasswordService,\n    @inject(TYPES.TokenService) private tokenService: ITokenService,\n    @inject(TYPES.Logger) private logger: ILogger\n  ) {}\n\n  public async execute(request: LoginRequest): Promise<LoginResponse> {\n    this.logger.info('Login attempt', {\n      email: request.email,\n      ipAddress: request.ipAddress,\n      userAgent: request.userAgent,\n      platform: request.platform\n    });\n\n    try {\n      // Input validation\n      this.validateRequest(request);\n\n      // Find user by email\n      const userEntity = await this.userRepository.findByEmail(request.email);\n      if (!userEntity) {\n        this.logger.warn('Login failed - user not found', { email: request.email });\n        throw new InvalidCredentialsError();\n      }\n\n      // Create user aggregate\n      const userAggregate = UserAggregate.fromEntity(userEntity);\n\n      // Check if account can login (active, verified, not locked)\n      if (!userAggregate.user.canLogin()) {\n        if (userAggregate.user.isAccountLocked()) {\n          this.logger.warn('Login failed - account locked', { \n            userId: userEntity._id,\n            email: request.email \n          });\n          throw new AccountLockedError();\n        }\n        \n        this.logger.warn('Login failed - account inactive or unverified', { \n          userId: userEntity._id,\n          email: request.email,\n          isActive: userEntity.isActive,\n          isVerified: userEntity.isVerified\n        });\n        throw new UnauthorizedAccessError('Account is not active or verified');\n      }\n\n      // Authenticate user\n      const isAuthenticated = userAggregate.authenticate(\n        request.password,\n        this.passwordService\n      );\n\n      if (!isAuthenticated) {\n        this.logger.warn('Login failed - invalid credentials', { \n          userId: userEntity._id,\n          email: request.email,\n          failedAttempts: userEntity.failedLoginAttempts + 1\n        });\n        \n        // Save failed attempt\n        await this.userRepository.save(userAggregate.toPlainObject());\n        \n        throw new InvalidCredentialsError();\n      }\n\n      // Check HIPAA compliance requirements\n      if (userAggregate.user.needsHipaaTraining()) {\n        this.logger.warn('Login warning - HIPAA training required', { \n          userId: userEntity._id,\n          email: request.email \n        });\n        // Don't block login but flag for mandatory training\n      }\n\n      // Generate tokens\n      const accessToken = this.tokenService.generateAccessToken(\n        userEntity._id,\n        userEntity.role\n      );\n      const refreshToken = this.tokenService.generateRefreshToken(userEntity._id);\n      \n      // Add refresh token to user\n      userAggregate.addRefreshToken(refreshToken);\n      \n      // Save successful login\n      await this.userRepository.save(userAggregate.toPlainObject());\n\n      // Log successful login event\n      const loginEvent = new UserLoginEvent({\n        userId: userEntity._id,\n        ipAddress: request.ipAddress,\n        userAgent: request.userAgent,\n        success: true\n      });\n      \n      // In a real implementation, this would be published to an event bus\n      this.logger.info('Login successful', {\n        userId: userEntity._id,\n        email: request.email,\n        role: userEntity.role,\n        ipAddress: request.ipAddress,\n        platform: request.platform\n      });\n\n      // Return response\n      return {\n        success: true,\n        user: {\n          _id: userEntity._id,\n          username: userEntity.username,\n          email: userEntity.email,\n          role: userEntity.role,\n          profile: userEntity.profile,\n          labId: userEntity.labId,\n          labName: userEntity.labName,\n          hospitalId: userEntity.hospitalId,\n          hospitalName: userEntity.hospitalName,\n          permissions: userAggregate.user.getPermissions(),\n          needsPasswordReset: userAggregate.user.needsPasswordReset(),\n          needsHipaaTraining: userAggregate.user.needsHipaaTraining()\n        },\n        tokens: {\n          accessToken,\n          refreshToken,\n          expiresIn: this.tokenService.getTokenExpiry()\n        },\n        message: 'Login successful'\n      };\n\n    } catch (error) {\n      // Log failed login event\n      if (error instanceof InvalidCredentialsError || \n          error instanceof AccountLockedError || \n          error instanceof UnauthorizedAccessError) {\n        \n        const loginEvent = new UserLoginEvent({\n          userId: '', // May not have user ID for invalid credentials\n          ipAddress: request.ipAddress,\n          userAgent: request.userAgent,\n          success: false\n        });\n        \n        this.logger.error('Login failed', {\n          email: request.email,\n          error: error.message,\n          ipAddress: request.ipAddress,\n          platform: request.platform\n        });\n      }\n      \n      throw error;\n    }\n  }\n\n  private validateRequest(request: LoginRequest): void {\n    if (!request.email?.trim()) {\n      throw new InvalidCredentialsError();\n    }\n\n    if (!request.password) {\n      throw new InvalidCredentialsError();\n    }\n\n    // Basic email format validation\n    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n    if (!emailRegex.test(request.email)) {\n      throw new InvalidCredentialsError();\n    }\n  }\n\n  // Helper method for mobile login (returns mobile-optimized response)\n  public async executeMobileLogin(request: LoginRequest): Promise<any> {\n    const response = await this.execute(request);\n    \n    // Return mobile-optimized response format\n    return {\n      success: response.success,\n      data: {\n        user: {\n          id: response.user._id,\n          email: response.user.email,\n          name: `${response.user.profile.firstName} ${response.user.profile.lastName}`,\n          role: response.user.role,\n          profile: {\n            firstName: response.user.profile.firstName,\n            lastName: response.user.profile.lastName,\n            phone: response.user.profile.phone,\n            avatar: response.user.profile.avatar || null\n          },\n          healthProfile: {\n            // Health profile would be populated from patient data if linked\n            height: null,\n            weight: null,\n            bloodGroup: null,\n            allergies: [],\n            medications: []\n          }\n        },\n        tokens: response.tokens\n      },\n      message: response.message,\n      timestamp: new Date().toISOString()\n    };\n  }\n}"