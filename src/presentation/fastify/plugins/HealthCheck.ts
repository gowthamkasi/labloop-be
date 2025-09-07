/**
 * Health Check Plugin for LabLoop Healthcare System
 * Provides comprehensive health monitoring for all system components
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { container, TYPES } from '@/config/Container.js';
import { IDatabaseConnection } from '@/infrastructure/persistence/index.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { IHealthCheckResponse } from '@/shared/types/Api.js';

interface IHealthCheckDependencies {
  readonly database: IDatabaseConnection;
  readonly logger: ILogger;
}

class HealthCheckService {
  private readonly database: IDatabaseConnection;
  private readonly logger: ILogger;

  constructor(dependencies: IHealthCheckDependencies) {
    this.database = dependencies.database;
    this.logger = dependencies.logger;
  }

  public async getHealthStatus(): Promise<IHealthCheckResponse> {
    const timestamp = new Date().toISOString();
    
    try {
      // Check database health
      const dbStatus = await this.database.getHealthStatus();
      
      // Determine overall system status
      const isHealthy = dbStatus === 'connected';
      
      const healthResponse: IHealthCheckResponse = {
        status: isHealthy ? 'ok' : 'error',
        timestamp,
        uptime: process.uptime(),
        version: '1.0.0',
        services: {
          database: dbStatus,
        },
      };

      if (!isHealthy) {
        this.logger.warn('Health check failed', {
          services: healthResponse.services,
        });
      }

      return healthResponse;
    } catch (error) {
      this.logger.error('Health check error', error as Error);
      
      return {
        status: 'error',
        timestamp,
        uptime: process.uptime(),
        version: '1.0.0',
        services: {
          database: 'error',
        },
      };
    }
  }

  public async getReadinessStatus(): Promise<{ status: string; timestamp: string }> {
    // For readiness, we only check if the service is ready to accept traffic
    // This is typically faster than a full health check
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }
}

const healthCheckPlugin: FastifyPluginAsync = async (fastify) => {
  // Get dependencies from container
  const database = container.get<IDatabaseConnection>(TYPES.DatabaseConnection);
  const logger = container.get<ILogger>(TYPES.Logger);
  
  const healthCheckService = new HealthCheckService({
    database,
    logger,
  });

  // Register health check route
  fastify.get('/health', {
    schema: {
      description: 'Comprehensive health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { 
                  type: 'string', 
                  enum: ['connected', 'disconnected', 'error'] 
                },
              },
              required: ['database'],
            },
          },
          required: ['status', 'timestamp', 'uptime', 'version', 'services'],
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            services: { type: 'object' },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const healthStatus = await healthCheckService.getHealthStatus();
    
    const statusCode = healthStatus.status === 'ok' ? 200 : 503;
    reply.code(statusCode).send(healthStatus);
  });

  // Register readiness probe route (for Kubernetes)
  fastify.get('/ready', {
    schema: {
      description: 'Readiness probe endpoint for Kubernetes',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
          required: ['status', 'timestamp'],
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const readiness = await healthCheckService.getReadinessStatus();
    reply.code(200).send(readiness);
  });

  // Register liveness probe route (for Kubernetes)
  fastify.get('/live', {
    schema: {
      description: 'Liveness probe endpoint for Kubernetes',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    // Liveness check is simple - if the process is running, it's alive
    reply.code(200).send({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  logger.debug('Health check plugin registered');
};

export default fp(healthCheckPlugin, {
  name: 'health-check',
});