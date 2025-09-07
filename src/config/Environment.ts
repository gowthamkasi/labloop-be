/**
 * Environment Configuration Management for LabLoop Healthcare System
 * Validates and provides typed access to environment variables
 */

import { IAppConfig } from '@/shared/types/Config.js';

export class Environment {
  private static instance: Environment;
  private readonly config: IAppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
    this.validate();
  }

  public static getInstance(): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }
    return Environment.instance;
  }

  private loadConfiguration(): IAppConfig {
    return {
      server: {
        host: process.env['HOST'] || '0.0.0.0',
        port: parseInt(process.env['PORT'] || '3001', 10),
        environment: (process.env['NODE_ENV'] as 'development' | 'staging' | 'production') || 'development',
        logLevel: (process.env['LOG_LEVEL'] as 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') || 'info',
        corsOrigins: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
        rateLimits: {
          global: {
            max: parseInt(process.env['RATE_LIMIT_GLOBAL_MAX'] || '1000', 10),
            timeWindow: process.env['RATE_LIMIT_GLOBAL_WINDOW'] || '15 minutes',
          },
          auth: {
            max: parseInt(process.env['RATE_LIMIT_AUTH_MAX'] || '10', 10),
            timeWindow: process.env['RATE_LIMIT_AUTH_WINDOW'] || '15 minutes',
          },
        },
      },
      database: {
        uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/labloop',
        name: process.env['DB_NAME'] || 'labloop',
        options: {
          maxPoolSize: parseInt(process.env['DB_MAX_POOL_SIZE'] || '10', 10),
          minPoolSize: parseInt(process.env['DB_MIN_POOL_SIZE'] || '2', 10),
          maxIdleTimeMS: parseInt(process.env['DB_MAX_IDLE_TIME_MS'] || '30000', 10),
          serverSelectionTimeoutMS: parseInt(process.env['DB_SERVER_SELECTION_TIMEOUT_MS'] || '5000', 10),
          heartbeatFrequencyMS: parseInt(process.env['DB_HEARTBEAT_FREQUENCY_MS'] || '10000', 10),
        },
      },
      redis: process.env['REDIS_HOST'] ? {
        host: process.env['REDIS_HOST'],
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['REDIS_DB'] || '0', 10),
        connectTimeout: parseInt(process.env['REDIS_CONNECT_TIMEOUT'] || '10000', 10),
        commandTimeout: parseInt(process.env['REDIS_COMMAND_TIMEOUT'] || '5000', 10),
      } : undefined,
      jwt: {
        secret: process.env['JWT_SECRET'] || 'labloop-jwt-secret-change-in-production',
        expiresIn: process.env['JWT_EXPIRES_IN'] || '1h',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
        issuer: process.env['JWT_ISSUER'] || 'labloop-backend',
        audience: process.env['JWT_AUDIENCE'] || 'labloop-app',
      },
      external: {
        email: {
          provider: (process.env['EMAIL_PROVIDER'] as 'smtp' | 'sendgrid' | 'ses') || 'smtp',
          apiKey: process.env['EMAIL_API_KEY'],
          smtpUrl: process.env['SMTP_URL'],
        },
        sms: {
          provider: (process.env['SMS_PROVIDER'] as 'twilio' | 'aws') || 'twilio',
          apiKey: process.env['SMS_API_KEY'] || '',
          fromNumber: process.env['SMS_FROM_NUMBER'] || '',
        },
        storage: {
          provider: (process.env['STORAGE_PROVIDER'] as 'local' | 's3' | 'gcs') || 'local',
          bucket: process.env['STORAGE_BUCKET'],
          region: process.env['STORAGE_REGION'],
          accessKey: process.env['STORAGE_ACCESS_KEY'],
          secretKey: process.env['STORAGE_SECRET_KEY'],
        },
      },
    };
  }

  private validate(): void {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Production-specific validations
    if (this.config.server.environment === 'production') {
      if (this.config.jwt.secret === 'labloop-jwt-secret-change-in-production') {
        throw new Error('JWT_SECRET must be changed in production environment');
      }

      if (!process.env['EMAIL_API_KEY'] && !process.env['SMTP_URL']) {
        throw new Error('Email configuration is required in production');
      }
    }

    // Port validation
    if (this.config.server.port < 1000 || this.config.server.port > 65535) {
      throw new Error('Invalid port number. Must be between 1000 and 65535');
    }

    // Database pool size validation
    if (this.config.database.options.minPoolSize >= this.config.database.options.maxPoolSize) {
      throw new Error('DB_MIN_POOL_SIZE must be less than DB_MAX_POOL_SIZE');
    }
  }

  public get(): IAppConfig {
    return this.config;
  }

  public getServer(): IAppConfig['server'] {
    return this.config.server;
  }

  public getDatabase(): IAppConfig['database'] {
    return this.config.database;
  }

  public getRedis(): IAppConfig['redis'] {
    return this.config.redis;
  }

  public getJwt(): IAppConfig['jwt'] {
    return this.config.jwt;
  }

  public getExternal(): IAppConfig['external'] {
    return this.config.external;
  }

  public isDevelopment(): boolean {
    return this.config.server.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.server.environment === 'production';
  }

  public isStaging(): boolean {
    return this.config.server.environment === 'staging';
  }
}

// Global environment instance
export const env = Environment.getInstance();