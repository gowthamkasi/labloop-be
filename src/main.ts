/**
 * LabLoop Healthcare Backend - Main Application Entry Point
 * High-performance Fastify server with clean architecture
 */

import 'reflect-metadata';
import { FastifyServer } from '@/presentation/fastify/server.js';
import { FastifyApp } from '@/presentation/fastify/app.js';
import { container, TYPES } from '@/config/Container.js';
import { Environment } from '@/config/Environment.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { IDatabaseConnection } from '@/infrastructure/persistence/index.js';

class Application {
  private fastifyServer: FastifyServer | null = null;
  private fastifyApp: FastifyApp | null = null;
  private logger: ILogger | null = null;
  private env: Environment | null = null;
  private database: IDatabaseConnection | null = null;

  public async bootstrap(): Promise<void> {
    try {
      // Initialize dependency injection container
      container.initialize();
      
      // Get core services
      this.env = container.get<Environment>(TYPES.Environment);
      this.logger = container.get<ILogger>(TYPES.Logger);
      this.database = container.get<IDatabaseConnection>(TYPES.DatabaseConnection);

      this.logger.info('Starting LabLoop Healthcare Backend', {
        version: '1.0.0',
        environment: this.env.getServer().environment,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      });

      // Initialize database connection
      await this.database.connect();

      // Create Fastify server and application
      this.fastifyServer = new FastifyServer({
        environment: this.env,
        logger: this.logger,
      });

      this.fastifyApp = new FastifyApp({
        environment: this.env,
        logger: this.logger,
      });

      // Create server instance
      const server = await this.fastifyServer.create();

      // Configure application (plugins, routes, etc.)
      await this.fastifyApp.configure(server);

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      // Start the server
      await this.fastifyServer.start();

      this.logger.info('LabLoop Healthcare Backend started successfully', {
        port: this.env.getServer().port,
        host: this.env.getServer().host,
        documentation: `http://${this.env.getServer().host}:${this.env.getServer().port}/docs`,
      });

    } catch (error) {
      if (this.logger) {
        this.logger.fatal('Failed to start application', error as Error);
      } else {
        console.error('Failed to start application:', error);
      }
      await this.shutdown(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    shutdownSignals.forEach((signal) => {
      process.on(signal, () => {
        this.logger?.info(`Received ${signal}, shutting down gracefully`);
        this.shutdown(0);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      this.logger?.fatal('Uncaught exception', error);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      this.logger?.fatal('Unhandled promise rejection', reason as Error, {
        promise: promise.toString(),
      });
      this.shutdown(1);
    });
  }

  private async shutdown(exitCode: number = 0): Promise<void> {
    this.logger?.info('Initiating graceful shutdown');

    try {
      // Close Fastify server
      if (this.fastifyServer) {
        await this.fastifyServer.stop();
      }

      // Close database connections
      if (this.database) {
        await this.database.disconnect();
      }

      // Close external service connections (will be implemented later)
      // await this.closeExternalConnections();

      this.logger?.info('Graceful shutdown completed');
    } catch (error) {
      this.logger?.error('Error during shutdown', error as Error);
      exitCode = 1;
    } finally {
      process.exit(exitCode);
    }
  }
}

// Start the application
async function main(): Promise<void> {
  const app = new Application();
  await app.bootstrap();
}

// Handle module execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Application startup failed:', error);
    process.exit(1);
  });
}

export { Application };