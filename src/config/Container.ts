/**
 * Dependency Injection Container for LabLoop Healthcare System
 * Using Inversify for type-safe dependency injection
 */

import 'reflect-metadata';
import { Container, ContainerModule, interfaces } from 'inversify';
import { ILogger } from '@/shared/utils/Logger.js';
import { Environment } from './Environment.js';

// Service Identifiers
export const TYPES = {
  // Core Services
  Logger: Symbol.for('Logger'),
  Environment: Symbol.for('Environment'),
  
  // Infrastructure Services
  DatabaseConnection: Symbol.for('DatabaseConnection'),
  RedisConnection: Symbol.for('RedisConnection'),
  
  // Application Services
  AuthService: Symbol.for('AuthService'),
  PatientService: Symbol.for('PatientService'),
  CaseService: Symbol.for('CaseService'),
  SampleService: Symbol.for('SampleService'),
  TestService: Symbol.for('TestService'),
  
  // Repository Interfaces
  UserRepository: Symbol.for('UserRepository'),
  PatientRepository: Symbol.for('PatientRepository'),
  CaseRepository: Symbol.for('CaseRepository'),
  SampleRepository: Symbol.for('SampleRepository'),
  TestRepository: Symbol.for('TestRepository'),
  HospitalRepository: Symbol.for('HospitalRepository'),
  LabRepository: Symbol.for('LabRepository'),
  
  // Use Cases
  CreatePatientUseCase: Symbol.for('CreatePatientUseCase'),
  UpdatePatientUseCase: Symbol.for('UpdatePatientUseCase'),
  GetPatientUseCase: Symbol.for('GetPatientUseCase'),
  CreateCaseUseCase: Symbol.for('CreateCaseUseCase'),
  UpdateCaseUseCase: Symbol.for('UpdateCaseUseCase'),
  GetCaseUseCase: Symbol.for('GetCaseUseCase'),
  
  // External Services
  EmailService: Symbol.for('EmailService'),
  SmsService: Symbol.for('SmsService'),
  StorageService: Symbol.for('StorageService'),
} as const;

// Core Infrastructure Module
export const coreModule = new ContainerModule((bind: interfaces.Bind) => {
  // Environment (singleton)
  bind<Environment>(TYPES.Environment)
    .toConstantValue(Environment.getInstance());
    
  // Logger (singleton)
  bind<ILogger>(TYPES.Logger)
    .toDynamicValue((context: interfaces.Context) => {
      const { createLogger } = require('@/shared/utils/Logger.js');
      const env = context.container.get<Environment>(TYPES.Environment);
      const config = env.getServer();
      
      return createLogger({
        level: config.logLevel,
        environment: config.environment,
        service: 'labloop-backend',
      });
    })
    .inSingletonScope();
});

// Infrastructure Module
export const infrastructureModule = new ContainerModule((bind: interfaces.Bind) => {
  // Database Connection (singleton)
  bind(TYPES.DatabaseConnection)
    .toDynamicValue((context: interfaces.Context) => {
      const { createDatabaseConnection } = require('@/infrastructure/persistence/mongodb/Connection.js');
      const env = context.container.get<Environment>(TYPES.Environment);
      const logger = context.container.get<ILogger>(TYPES.Logger);
      
      return createDatabaseConnection(env, logger);
    })
    .inSingletonScope();
    
  // Database repositories will be bound here when implemented
  // bind<IUserRepository>(TYPES.UserRepository).to(MongoUserRepository);
  // bind<IPatientRepository>(TYPES.PatientRepository).to(MongoPatientRepository);
  // etc.
});

// Application Module
export const applicationModule = new ContainerModule((_bind: interfaces.Bind) => {
  // Application services will be bound here when implemented
  // bind<IPatientService>(TYPES.PatientService).to(PatientService);
  // bind<ICaseService>(TYPES.CaseService).to(CaseService);
  // etc.
});

// Use Cases Module
export const useCasesModule = new ContainerModule((_bind: interfaces.Bind) => {
  // Use cases will be bound here when implemented
  // bind<ICreatePatientUseCase>(TYPES.CreatePatientUseCase).to(CreatePatientUseCase);
  // bind<IUpdatePatientUseCase>(TYPES.UpdatePatientUseCase).to(UpdatePatientUseCase);
  // etc.
});

// External Services Module
export const externalServicesModule = new ContainerModule((_bind: interfaces.Bind) => {
  // External services will be bound here when implemented
  // bind<IEmailService>(TYPES.EmailService).to(EmailService);
  // bind<ISmsService>(TYPES.SmsService).to(SmsService);
  // etc.
});

class DIContainer {
  private static instance: DIContainer;
  private readonly container: Container;
  private initialized = false;

  private constructor() {
    this.container = new Container({
      defaultScope: 'Singleton',
      skipBaseClassChecks: true,
    });
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    // Load modules
    this.container.load(
      coreModule,
      infrastructureModule,
      applicationModule,
      useCasesModule,
      externalServicesModule
    );

    this.initialized = true;
  }

  public get<T>(serviceIdentifier: symbol): T {
    if (!this.initialized) {
      throw new Error('Container must be initialized before use');
    }
    return this.container.get<T>(serviceIdentifier);
  }

  public getAsync<T>(serviceIdentifier: symbol): Promise<T> {
    if (!this.initialized) {
      throw new Error('Container must be initialized before use');
    }
    return this.container.getAsync<T>(serviceIdentifier);
  }

  public bind<T>(serviceIdentifier: symbol): interfaces.BindingToSyntax<T> {
    return this.container.bind<T>(serviceIdentifier);
  }

  public isBound(serviceIdentifier: symbol): boolean {
    return this.container.isBound(serviceIdentifier);
  }

  public unbind(serviceIdentifier: symbol): void {
    this.container.unbind(serviceIdentifier);
  }

  public getContainer(): Container {
    return this.container;
  }

  public snapshot(): void {
    this.container.snapshot();
  }

  public restore(): void {
    this.container.restore();
  }
}

// Global container instance
export const container = DIContainer.getInstance();

// Helper function to get services
export function getService<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}

export function getServiceAsync<T>(serviceIdentifier: symbol): Promise<T> {
  return container.getAsync<T>(serviceIdentifier);
}