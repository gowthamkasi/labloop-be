/**
 * Configuration types for the LabLoop Healthcare System
 */

export interface IDatabaseConfig {
  readonly uri: string;
  readonly name: string;
  readonly options: {
    readonly maxPoolSize: number;
    readonly minPoolSize: number;
    readonly maxIdleTimeMS: number;
    readonly serverSelectionTimeoutMS: number;
    readonly heartbeatFrequencyMS: number;
  };
}

export interface IRedisConfig {
  readonly host: string;
  readonly port: number;
  readonly password?: string;
  readonly db: number;
  readonly connectTimeout: number;
  readonly commandTimeout: number;
}

export interface IJwtConfig {
  readonly secret: string;
  readonly expiresIn: string;
  readonly refreshExpiresIn: string;
  readonly issuer: string;
  readonly audience: string;
}

export interface IServerConfig {
  readonly host: string;
  readonly port: number;
  readonly environment: 'development' | 'staging' | 'production';
  readonly logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  readonly corsOrigins: readonly string[];
  readonly rateLimits: {
    readonly global: {
      readonly max: number;
      readonly timeWindow: string;
    };
    readonly auth: {
      readonly max: number;
      readonly timeWindow: string;
    };
  };
}

export interface IExternalServicesConfig {
  readonly email: {
    readonly provider: 'smtp' | 'sendgrid' | 'ses';
    readonly apiKey?: string;
    readonly smtpUrl?: string;
  };
  readonly sms: {
    readonly provider: 'twilio' | 'aws';
    readonly apiKey: string;
    readonly fromNumber: string;
  };
  readonly storage: {
    readonly provider: 'local' | 's3' | 'gcs';
    readonly bucket?: string;
    readonly region?: string;
    readonly accessKey?: string;
    readonly secretKey?: string;
  };
}

export interface IAppConfig {
  readonly server: IServerConfig;
  readonly database: IDatabaseConfig;
  readonly redis?: IRedisConfig;
  readonly jwt: IJwtConfig;
  readonly external: IExternalServicesConfig;
}