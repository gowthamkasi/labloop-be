/**
 * API-related shared types for the LabLoop Healthcare System
 */

export interface IApiResponse<T = unknown> {
  readonly success: boolean;
  readonly message: string;
  readonly data?: T;
  readonly error?: IApiError;
  readonly timestamp: string;
  readonly requestId: string;
}

export interface IApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown> | undefined;
  readonly field?: string | undefined;
}

export interface IHealthCheckResponse {
  readonly status: 'ok' | 'error';
  readonly timestamp: string;
  readonly uptime: number;
  readonly version: string;
  readonly services: {
    readonly database: 'connected' | 'disconnected' | 'error';
    readonly cache?: 'connected' | 'disconnected' | 'error';
    readonly external?: Record<string, 'connected' | 'disconnected' | 'error'>;
  };
}

export interface IAuthTokenPayload {
  readonly sub: string; // User ID
  readonly email: string;
  readonly role: string;
  readonly hospitalId?: string;
  readonly labId?: string;
  readonly exp: number;
  readonly iat: number;
}

export interface ILoginRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

export interface ILoginResponse {
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: string;
    readonly hospitalId?: string;
    readonly labId?: string;
  };
}