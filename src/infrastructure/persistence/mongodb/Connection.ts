/**
 * MongoDB Connection Management for LabLoop Healthcare System
 * Provides robust connection handling with health monitoring and reconnection logic
 */

import mongoose, { Connection } from 'mongoose';
import { Environment } from '@/config/Environment.js';
import { ILogger } from '@/shared/utils/Logger.js';
import { DatabaseError } from '@/shared/exceptions/AppError.js';

export interface IDatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealthStatus(): Promise<'connected' | 'disconnected' | 'error'>;
  getConnection(): Connection;
}

export interface IConnectionDependencies {
  readonly environment: Environment;
  readonly logger: ILogger;
}

export class MongoDBConnection implements IDatabaseConnection {
  private readonly env: Environment;
  private readonly logger: ILogger;
  private connection: Connection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 5000; // 5 seconds

  constructor(dependencies: IConnectionDependencies) {
    this.env = dependencies.environment;
    this.logger = dependencies.logger;
    this.setupEventListeners();
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) {
      this.logger.debug('MongoDB already connected');
      return;
    }

    if (this.isConnecting) {
      this.logger.debug('MongoDB connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      const dbConfig = this.env.getDatabase();
      
      this.logger.info('Connecting to MongoDB', {
        uri: this.sanitizeUri(dbConfig.uri),
        database: dbConfig.name,
      });

      await mongoose.connect(dbConfig.uri, {
        dbName: dbConfig.name,
        maxPoolSize: dbConfig.options.maxPoolSize,
        minPoolSize: dbConfig.options.minPoolSize,
        maxIdleTimeMS: dbConfig.options.maxIdleTimeMS,
        serverSelectionTimeoutMS: dbConfig.options.serverSelectionTimeoutMS,
        heartbeatFrequencyMS: dbConfig.options.heartbeatFrequencyMS,
        
        // Additional production settings
        maxConnecting: 2,
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        
        // Replica set settings (if applicable)
        replicaSet: process.env.DB_REPLICA_SET,
        readPreference: 'primaryPreferred',
        
        // Authentication (if required)
        authSource: process.env.DB_AUTH_SOURCE || 'admin',
        
        // SSL/TLS settings for production
        ssl: this.env.isProduction(),
        sslValidate: this.env.isProduction(),
      });

      this.connection = mongoose.connection;
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      this.logger.info('MongoDB connected successfully', {
        database: dbConfig.name,
        host: this.connection.host,
        port: this.connection.port,
        readyState: this.connection.readyState,
      });

    } catch (error) {
      this.isConnecting = false;
      const dbError = error as Error;
      
      this.logger.error('Failed to connect to MongoDB', dbError, {
        reconnectAttempts: this.reconnectAttempts,
      });

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        throw new DatabaseError('Failed to connect to MongoDB after maximum attempts', {
          attempts: this.reconnectAttempts,
          error: dbError.message,
        });
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    try {
      this.logger.info('Disconnecting from MongoDB');
      await mongoose.disconnect();
      this.connection = null;
      this.logger.info('MongoDB disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from MongoDB', error as Error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  public async getHealthStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      if (!this.connection) {
        return 'disconnected';
      }

      // Check connection state
      if (this.connection.readyState === 1) {
        // Perform a simple ping to verify the connection is actually working
        await this.connection.db.admin().ping();
        return 'connected';
      } else {
        return 'disconnected';
      }
    } catch (error) {
      this.logger.error('Database health check failed', error as Error);
      return 'error';
    }
  }

  public getConnection(): Connection {
    if (!this.connection) {
      throw new DatabaseError('MongoDB connection not established');
    }
    return this.connection;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connecting', () => {
      this.logger.debug('MongoDB connection establishing');
    });

    mongoose.connection.on('connected', () => {
      this.logger.info('MongoDB connected');
    });

    mongoose.connection.on('open', () => {
      this.logger.debug('MongoDB connection opened');
    });

    mongoose.connection.on('disconnecting', () => {
      this.logger.debug('MongoDB disconnecting');
    });

    mongoose.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
      
      if (!this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    mongoose.connection.on('close', () => {
      this.logger.info('MongoDB connection closed');
    });

    mongoose.connection.on('error', (error: Error) => {
      this.logger.error('MongoDB connection error', error);
      
      if (!this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    });

    mongoose.connection.on('fullsetup', () => {
      this.logger.debug('MongoDB replica set fully connected');
    });

    mongoose.connection.on('all', () => {
      this.logger.debug('MongoDB replica set all connections established');
    });

    mongoose.connection.on('reconnected', () => {
      this.logger.info('MongoDB reconnected');
      this.reconnectAttempts = 0;
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    this.logger.info('Scheduling MongoDB reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delay: this.reconnectInterval,
    });

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnection attempt failed', error as Error);
      }
    }, this.reconnectInterval);
  }

  private sanitizeUri(uri: string): string {
    // Remove credentials from URI for logging
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }
}

// Factory function for creating database connection
export function createDatabaseConnection(
  environment: Environment, 
  logger: ILogger
): IDatabaseConnection {
  return new MongoDBConnection({ environment, logger });
}