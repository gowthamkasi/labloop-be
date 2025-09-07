/**
 * MongoDB Infrastructure Export Index
 * Central export point for MongoDB-related components in LabLoop Healthcare System
 */

// Database connection
export { 
  MongoDBConnection, 
  IDatabaseConnection, 
  createDatabaseConnection 
} from './Connection.js';

// Models
export * from './models/index.js';

// Repositories
export * from './repositories/index.js';

// Database setup and utilities
export { DatabaseSetup, IDatabaseSetup } from './setup/DatabaseSetup.js';

// Migrations
export { CreateIndexesMigration } from './migrations/001_create_indexes.js';

// Seeders
export { UserSeeder } from './seeds/UserSeeder.js';
export { PatientSeeder } from './seeds/PatientSeeder.js';