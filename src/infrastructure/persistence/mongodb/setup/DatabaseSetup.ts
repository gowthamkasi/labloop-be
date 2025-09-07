/**
 * Database Setup for LabLoop Healthcare System
 * Comprehensive database initialization with migrations, seeding, and health checks
 */

import mongoose from 'mongoose';
import { ILogger } from '@/shared/utils/Logger.js';
import { Environment } from '@/config/Environment.js';
import { createDatabaseConnection, IDatabaseConnection } from '../Connection.js';

// Migrations
import { CreateIndexesMigration, IMigration } from '../migrations/001_create_indexes.js';

// Seeders
import { UserSeeder, ISeeder } from '../seeds/UserSeeder.js';
import { PatientSeeder } from '../seeds/PatientSeeder.js';

export interface IDatabaseSetup {
  initialize(options?: {
    runMigrations?: boolean;
    runSeeding?: boolean;
    environment?: string;
  }): Promise<void>;
  runMigrations(): Promise<void>;
  runSeeding(): Promise<void>;
  healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }>;
  disconnect(): Promise<void>;
}

export class DatabaseSetup implements IDatabaseSetup {
  private readonly logger: ILogger;
  private readonly environment: Environment;
  private readonly connection: IDatabaseConnection;
  private readonly migrations: IMigration[];
  private readonly seeders: ISeeder[];

  constructor(logger: ILogger, environment: Environment) {
    this.logger = logger;
    this.environment = environment;
    this.connection = createDatabaseConnection(environment, logger);
    
    // Initialize migrations
    this.migrations = [
      new CreateIndexesMigration(logger),
    ];

    // Initialize seeders
    this.seeders = [
      new UserSeeder(logger),
      new PatientSeeder(logger),
    ];
  }

  async initialize(options: {
    runMigrations?: boolean;
    runSeeding?: boolean;
    environment?: string;
  } = {}): Promise<void> {
    const {
      runMigrations = true,
      runSeeding = false,
      environment = 'development'
    } = options;

    this.logger.info('Initializing LabLoop database setup', {
      environment,
      runMigrations,
      runSeeding
    });

    try {
      // Establish database connection
      await this.connection.connect();
      
      // Wait for connection to be ready
      await this.waitForConnection();

      // Run migrations if requested
      if (runMigrations) {
        await this.runMigrations();
      }

      // Run seeding if requested (typically only in development/testing)
      if (runSeeding && ['development', 'test'].includes(environment)) {
        await this.runSeeding();
      }

      // Perform health check
      const healthStatus = await this.healthCheck();
      if (healthStatus.status === 'unhealthy') {
        throw new Error('Database health check failed after initialization');
      }

      this.logger.info('Database setup completed successfully', {
        environment,
        runMigrations,
        runSeeding,
        healthStatus: healthStatus.status
      });

    } catch (error) {
      this.logger.error('Database setup failed', error as Error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    this.logger.info('Running database migrations');

    try {
      // Create migrations tracking collection if it doesn't exist
      await this.ensureMigrationsCollection();

      // Get completed migrations
      const completedMigrations = await this.getCompletedMigrations();

      for (const migration of this.migrations) {
        if (completedMigrations.includes(migration.version)) {
          this.logger.debug(`Migration ${migration.version} already completed, skipping`);
          continue;
        }

        this.logger.info(`Running migration ${migration.version}: ${migration.description}`);
        
        const startTime = Date.now();
        await migration.up();
        const duration = Date.now() - startTime;

        // Record migration completion
        await this.recordMigrationCompletion(migration, duration);
        
        this.logger.info(`Migration ${migration.version} completed successfully`, {
          duration: `${duration}ms`
        });
      }

      this.logger.info('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed', error as Error);
      throw error;
    }
  }

  async runSeeding(): Promise<void> {
    this.logger.info('Running database seeding');

    try {
      for (const seeder of this.seeders) {
        this.logger.info(`Running seeder: ${seeder.name}`);
        
        const startTime = Date.now();
        await seeder.seed();
        const duration = Date.now() - startTime;
        
        this.logger.info(`Seeder ${seeder.name} completed successfully`, {
          duration: `${duration}ms`
        });
      }

      this.logger.info('All seeders completed successfully');
    } catch (error) {
      this.logger.error('Seeding failed', error as Error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
  }> {
    try {
      this.logger.debug('Performing database health check');

      const details: any = {
        connection: 'unknown',
        collections: {},
        indexes: {},
        migrations: 'unknown',
        timestamp: new Date().toISOString()
      };

      // Check connection status
      const connectionHealth = await this.connection.getHealthStatus();
      details.connection = connectionHealth;

      if (connectionHealth !== 'connected') {
        return {
          status: 'unhealthy',
          details: {
            ...details,
            error: 'Database connection not established'
          }
        };
      }

      // Check collections
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        const collectionName = collection.name;
        if (!collectionName.startsWith('system.')) {
          const stats = await db.collection(collectionName).stats();
          details.collections[collectionName] = {
            documentCount: stats.count || 0,
            avgDocumentSize: stats.avgObjSize || 0,
            totalSize: stats.size || 0
          };

          // Check indexes
          const indexes = await db.collection(collectionName).listIndexes().toArray();
          details.indexes[collectionName] = indexes.length;
        }
      }

      // Check migrations status
      try {
        const completedMigrations = await this.getCompletedMigrations();
        details.migrations = {
          total: this.migrations.length,
          completed: completedMigrations.length,
          pending: this.migrations.length - completedMigrations.length
        };
      } catch (error) {
        details.migrations = 'error checking migrations';
      }

      // Perform a simple query to ensure database is responsive
      await db.admin().ping();

      this.logger.debug('Database health check completed successfully');

      return {
        status: 'healthy',
        details
      };

    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from database');
    
    try {
      await this.connection.disconnect();
      this.logger.info('Database disconnection completed');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error as Error);
      throw error;
    }
  }

  // ====================== PRIVATE METHODS ======================

  private async waitForConnection(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.connection.isConnected()) {
        return;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Database connection timeout after ${timeout}ms`);
  }

  private async ensureMigrationsCollection(): Promise<void> {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'migrations' }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection('migrations');
      this.logger.debug('Created migrations collection');
    }
  }

  private async getCompletedMigrations(): Promise<string[]> {
    const db = mongoose.connection.db;
    const migrationsCollection = db.collection('migrations');
    
    const completedMigrations = await migrationsCollection
      .find({}, { projection: { version: 1 } })
      .toArray();
    
    return completedMigrations.map(m => m.version);
  }

  private async recordMigrationCompletion(migration: IMigration, duration: number): Promise<void> {
    const db = mongoose.connection.db;
    const migrationsCollection = db.collection('migrations');
    
    await migrationsCollection.insertOne({
      version: migration.version,
      description: migration.description,
      executedAt: new Date(),
      duration: duration,
      checksum: this.generateMigrationChecksum(migration)
    });
  }

  private generateMigrationChecksum(migration: IMigration): string {
    // Simple checksum based on migration version and description
    // In production, you might want a more sophisticated checksum
    const data = `${migration.version}-${migration.description}`;
    return Buffer.from(data).toString('base64').substring(0, 16);
  }

  // ====================== ROLLBACK METHODS (FOR DEVELOPMENT) ======================

  async rollbackLastMigration(): Promise<void> {
    if (this.environment.isProduction()) {
      throw new Error('Migration rollback is not allowed in production environment');
    }

    this.logger.warn('Rolling back last migration');

    try {
      const completedMigrations = await this.getCompletedMigrations();
      
      if (completedMigrations.length === 0) {
        this.logger.info('No migrations to rollback');
        return;
      }

      // Find the last migration to rollback
      const lastMigrationVersion = completedMigrations[completedMigrations.length - 1];
      const migration = this.migrations.find(m => m.version === lastMigrationVersion);

      if (!migration) {
        throw new Error(`Migration ${lastMigrationVersion} not found`);
      }

      this.logger.info(`Rolling back migration ${migration.version}: ${migration.description}`);

      await migration.down();

      // Remove from completed migrations
      const db = mongoose.connection.db;
      const migrationsCollection = db.collection('migrations');
      await migrationsCollection.deleteOne({ version: migration.version });

      this.logger.info(`Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      this.logger.error('Migration rollback failed', error as Error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (this.environment.isProduction()) {
      throw new Error('Data clearing is not allowed in production environment');
    }

    this.logger.warn('Clearing all database data');

    try {
      // Clear all seeders data
      for (const seeder of this.seeders) {
        this.logger.info(`Clearing data for seeder: ${seeder.name}`);
        await seeder.clear();
      }

      this.logger.info('All data cleared successfully');
    } catch (error) {
      this.logger.error('Data clearing failed', error as Error);
      throw error;
    }
  }
}