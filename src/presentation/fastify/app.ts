/**
 * Fastify Application Configuration for LabLoop Healthcare System
 * Configures all plugins, middleware, and routes
 */

import { FastifyInstance } from 'fastify';
import { Environment } from '@/config/Environment.js';
import { ILogger } from '@/shared/utils/Logger.js';

export interface IAppDependencies {
  readonly environment: Environment;
  readonly logger: ILogger;
}

export class FastifyApp {
  private readonly env: Environment;
  private readonly logger: ILogger;

  constructor(dependencies: IAppDependencies) {
    this.env = dependencies.environment;
    this.logger = dependencies.logger;
  }

  public async configure(server: FastifyInstance): Promise<void> {
    this.logger.info('Configuring Fastify application');

    // Register core plugins
    await this.registerCorePlugins(server);
    
    // Register security plugins
    await this.registerSecurityPlugins(server);
    
    // Register utility plugins
    await this.registerUtilityPlugins(server);
    
    // Register authentication
    await this.registerAuthentication(server);
    
    // Register documentation
    await this.registerDocumentation(server);
    
    // Register error handling
    await this.registerErrorHandling(server);
    
    // Register routes
    await this.registerRoutes(server);

    this.logger.info('Fastify application configured successfully');
  }

  private async registerCorePlugins(server: FastifyInstance): Promise<void> {
    // CORS Configuration
    const serverConfig = this.env.getServer();
    
    await server.register(import('@fastify/cors'), {
      origin: serverConfig.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
    });

    // Form body parsing
    await server.register(import('@fastify/formbody'));
    
    // Multipart support (for file uploads)
    await server.register(import('@fastify/multipart'), {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for medical documents
        files: 10, // Maximum 10 files per request
        headerPairs: 2000,
      },
    });

    // Cookie support
    await server.register(import('@fastify/cookie'), {
      secret: this.env.getJwt().secret,
      parseOptions: {
        httpOnly: true,
        secure: this.env.isProduction(),
        sameSite: 'strict',
      },
    });

    // Response compression
    await server.register(import('@fastify/compress'), {
      global: true,
      encodings: ['gzip', 'deflate'],
    });

    this.logger.debug('Core plugins registered');
  }

  private async registerSecurityPlugins(server: FastifyInstance): Promise<void> {
    // Helmet for security headers
    await server.register(import('@fastify/helmet'), {
      contentSecurityPolicy: this.env.isDevelopment() ? false : {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Swagger UI
    });

    // Rate limiting
    await server.register(import('@fastify/rate-limit'), {
      global: true,
      max: this.env.getServer().rateLimits.global.max,
      timeWindow: this.env.getServer().rateLimits.global.timeWindow,
      errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        success: false,
        message: 'Too many requests',
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${Math.round(context.ttl / 1000)} seconds.`,
          details: {
            max: context.max,
            remaining: context.remaining,
            resetTime: new Date(Date.now() + context.ttl).toISOString(),
          },
        },
        timestamp: new Date().toISOString(),
        requestId: request.id,
      }),
    });

    this.logger.debug('Security plugins registered');
  }

  private async registerUtilityPlugins(server: FastifyInstance): Promise<void> {
    // Environment variables validation
    await server.register(import('@fastify/env'), {
      confKey: 'config',
      schema: {
        type: 'object',
        properties: {
          NODE_ENV: { type: 'string' },
          PORT: { type: 'number', default: 3001 },
          HOST: { type: 'string', default: '0.0.0.0' },
          MONGODB_URI: { type: 'string' },
          JWT_SECRET: { type: 'string' },
        },
        required: ['MONGODB_URI', 'JWT_SECRET'],
      },
    });

    this.logger.debug('Utility plugins registered');
  }

  private async registerAuthentication(server: FastifyInstance): Promise<void> {
    // JWT Plugin
    await server.register(import('@fastify/jwt'), {
      secret: this.env.getJwt().secret,
      sign: {
        expiresIn: this.env.getJwt().expiresIn,
        issuer: this.env.getJwt().issuer,
        audience: this.env.getJwt().audience,
      },
      verify: {
        issuer: this.env.getJwt().issuer,
        audience: this.env.getJwt().audience,
      },
    });

    // Authentication decorator
    server.decorate('authenticate', async function (request, reply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({
          statusCode: 401,
          success: false,
          message: 'Authentication required',
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: 'Invalid or expired token',
          },
          timestamp: new Date().toISOString(),
          requestId: request.id,
        });
      }
    });

    this.logger.debug('Authentication plugins registered');
  }

  private async registerDocumentation(server: FastifyInstance): Promise<void> {
    // OpenAPI/Swagger Documentation
    await server.register(import('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'LabLoop Healthcare API',
          description: 'Comprehensive Lab Management System API',
          version: '1.0.0',
          contact: {
            name: 'LabLoop Team',
            email: 'support@labloop.com',
          },
          license: {
            name: 'Proprietary',
          },
        },
        host: `${this.env.getServer().host}:${this.env.getServer().port}`,
        schemes: [this.env.isProduction() ? 'https' : 'http'],
        consumes: ['application/json', 'multipart/form-data'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        security: [{ bearerAuth: [] }],
        tags: [
          { name: 'Health', description: 'Health check endpoints' },
          { name: 'Authentication', description: 'User authentication' },
          { name: 'Patients', description: 'Patient management' },
          { name: 'Cases', description: 'Case management' },
          { name: 'Samples', description: 'Sample management' },
          { name: 'Tests', description: 'Test catalog' },
          { name: 'Reports', description: 'Report generation' },
          { name: 'Hospitals', description: 'Hospital management' },
          { name: 'Labs', description: 'Laboratory management' },
        ],
      },
    });

    // Swagger UI
    await server.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        defaultModelRendering: 'model',
        persistAuthorization: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });

    this.logger.debug('Documentation plugins registered');
  }

  private async registerErrorHandling(server: FastifyInstance): Promise<void> {
    // Global error handler will be implemented here
    // For now, we'll add a basic handler
    server.setErrorHandler(function (error, request, reply) {
      const statusCode = error.statusCode || 500;
      const errorResponse = {
        statusCode,
        success: false,
        message: error.message || 'Internal server error',
        error: {
          code: error.code || 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
        requestId: request.id,
      };

      request.log.error({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        statusCode,
      }, 'Request error');

      reply.code(statusCode).send(errorResponse);
    });

    this.logger.debug('Error handling configured');
  }

  private async registerRoutes(server: FastifyInstance): Promise<void> {
    // Register health check plugin
    const { healthCheckPlugin } = await import('./plugins/index.js');
    await server.register(healthCheckPlugin);

    this.logger.debug('Routes registered');
  }
}