/**
 * Structured Logging Utility for the LabLoop Healthcare System
 * Using Pino for high-performance JSON logging
 */

import pino, { Logger as PinoLogger } from 'pino';
import { randomUUID } from 'crypto';

export interface ILogContext {
  readonly requestId?: string;
  readonly userId?: string;
  readonly patientId?: string;
  readonly caseId?: string;
  readonly action?: string;
  readonly resource?: string;
  readonly duration?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface ILogger {
  trace(message: string, context?: ILogContext): void;
  debug(message: string, context?: ILogContext): void;
  info(message: string, context?: ILogContext): void;
  warn(message: string, context?: ILogContext): void;
  error(message: string, error?: Error, context?: ILogContext): void;
  fatal(message: string, error?: Error, context?: ILogContext): void;
  
  child(bindings: Record<string, unknown>): ILogger;
}

class Logger implements ILogger {
  private readonly pinoLogger: PinoLogger;

  constructor(pinoLogger: PinoLogger) {
    this.pinoLogger = pinoLogger;
  }

  public trace(message: string, context?: ILogContext): void {
    this.pinoLogger.trace(context, message);
  }

  public debug(message: string, context?: ILogContext): void {
    this.pinoLogger.debug(context, message);
  }

  public info(message: string, context?: ILogContext): void {
    this.pinoLogger.info(context, message);
  }

  public warn(message: string, context?: ILogContext): void {
    this.pinoLogger.warn(context, message);
  }

  public error(message: string, error?: Error, context?: ILogContext): void {
    const logData = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    this.pinoLogger.error(logData, message);
  }

  public fatal(message: string, error?: Error, context?: ILogContext): void {
    const logData = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    this.pinoLogger.fatal(logData, message);
  }

  public child(bindings: Record<string, unknown>): ILogger {
    return new Logger(this.pinoLogger.child(bindings));
  }
}

export function createLogger(options?: {
  level?: string;
  environment?: string;
  service?: string;
}): ILogger {
  const { 
    level = process.env['LOG_LEVEL'] || 'info', 
    environment = process.env['NODE_ENV'] || 'development',
    service = 'labloop-backend'
  } = options || {};

  const pinoConfig: pino.LoggerOptions = {
    name: service,
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}), // Remove default hostname/pid
    },
    base: {
      service,
      environment,
    },
  };

  // Development: Pretty printing for better readability
  if (environment === 'development') {
    pinoConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname,service',
        singleLine: false,
        levelFirst: true,
        messageFormat: '{service} [{level}] {msg}',
      },
    };
  }

  const pinoLogger = pino(pinoConfig);
  return new Logger(pinoLogger);
}

export function generateRequestId(): string {
  return randomUUID();
}

// Global logger instance
export const logger = createLogger();