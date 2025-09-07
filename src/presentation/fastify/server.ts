/**
 * Fastify Server Configuration for LabLoop Healthcare System
 * High-performance HTTP server with healthcare-grade security and logging
 */

import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { Environment } from '@/config/Environment.js';
import { createLogger, ILogger } from '@/shared/utils/Logger.js';

export interface IServerDependencies {
  readonly environment: Environment;
  readonly logger: ILogger;
}

export class FastifyServer {
  private server: FastifyInstance | null = null;
  private readonly env: Environment;
  private readonly logger: ILogger;

  constructor(dependencies: IServerDependencies) {
    this.env = dependencies.environment;
    this.logger = dependencies.logger;
  }

  public async create(): Promise<FastifyInstance> {
    if (this.server) {
      return this.server;
    }

    const serverConfig = this.env.getServer();
    
    const options: FastifyServerOptions = {
      // Use our structured logger
      logger: createLogger({
        level: serverConfig.logLevel,
        environment: serverConfig.environment,
        service: 'labloop-backend',
      }) as any, // Fastify expects Pino logger interface
      
      // Request ID generation for tracing
      genReqId: () => {
        const { randomUUID } = require('crypto');
        return randomUUID();
      },
      
      // Trust proxy for accurate client IP
      trustProxy: serverConfig.environment === 'production',
      
      // Case sensitive routing
      caseSensitive: false,
      
      // Ignore trailing slashes
      ignoreTrailingSlash: true,
      
      // Maximum parameter length (security)
      maxParamLength: 200,
      
      // Body size limits (healthcare documents can be large)
      bodyLimit: 50 * 1024 * 1024, // 50MB
      
      // Keep alive timeout
      keepAliveTimeout: 72000,
      
      // Connection timeout
      connectionTimeout: 10000,
      
      // Disable powered by header
      disableRequestLogging: false,
      
      // Plugin timeout
      pluginTimeout: 30000,
    };

    this.server = Fastify(options);
    
    // Add request context for logging
    await this.server.register(async (fastify) => {
      fastify.addHook('onRequest', async (request) => {
        request.log = request.log.child({
          requestId: request.id,
          method: request.method,
          url: request.url,
          userAgent: request.headers['user-agent'],
          ip: request.ip,
        });
      });
      
      fastify.addHook('onResponse', async (request, reply) => {
        const responseTime = reply.elapsedTime;
        request.log.info({
          statusCode: reply.statusCode,
          responseTime: `${responseTime}ms`,
        }, 'Request completed');
      });
    });

    this.logger.info('Fastify server instance created', {
      environment: serverConfig.environment,
      logLevel: serverConfig.logLevel,
    });

    return this.server;
  }

  public async start(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not created. Call create() first.');
    }

    const serverConfig = this.env.getServer();

    try {
      await this.server.listen({
        host: serverConfig.host,
        port: serverConfig.port,
      });

      this.logger.info('Server started successfully', {
        host: serverConfig.host,
        port: serverConfig.port,
        environment: serverConfig.environment,
      });
    } catch (error) {
      this.logger.fatal('Failed to start server', error as Error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    try {
      await this.server.close();
      this.logger.info('Server stopped gracefully');
    } catch (error) {
      this.logger.error('Error stopping server', error as Error);
      throw error;
    }
  }

  public getServer(): FastifyInstance {
    if (!this.server) {
      throw new Error('Server not created. Call create() first.');
    }
    return this.server;
  }

  public async registerPlugins(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not created. Call create() first.');
    }

    // Plugins will be registered here
    this.logger.info('Registering Fastify plugins');
  }

  public async registerRoutes(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not created. Call create() first.');
    }

    // Routes will be registered here
    this.logger.info('Registering application routes');
  }
}