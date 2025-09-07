/**
 * User Domain Events
 * Domain events for user-related business operations
 */

export interface IDomainEvent {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  timestamp: Date;
  data: any;
}

export class UserCreatedEvent implements IDomainEvent {
  public readonly eventType = 'UserCreated';
  public readonly aggregateType = 'User';
  public readonly version = 1;
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly data: any;

  constructor(userData: any) {
    this.aggregateId = userData._id;
    this.timestamp = new Date();
    this.data = {
      userId: userData._id,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      labId: userData.labId,
      hospitalId: userData.hospitalId,
      createdBy: userData.createdBy
    };
  }
}

export class UserUpdatedEvent implements IDomainEvent {
  public readonly eventType = 'UserUpdated';
  public readonly aggregateType = 'User';
  public readonly version = 1;
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly data: any;

  constructor(eventData: {
    userId: string;
    changes: any;
    updatedBy?: string;
  }) {
    this.aggregateId = eventData.userId;
    this.timestamp = new Date();
    this.data = {
      userId: eventData.userId,
      changes: eventData.changes,
      updatedBy: eventData.updatedBy
    };
  }
}

export class UserDeactivatedEvent implements IDomainEvent {
  public readonly eventType = 'UserDeactivated';
  public readonly aggregateType = 'User';
  public readonly version = 1;
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly data: any;

  constructor(eventData: {
    userId: string;
    reason?: string;
    deactivatedBy: string;
  }) {
    this.aggregateId = eventData.userId;
    this.timestamp = new Date();
    this.data = {
      userId: eventData.userId,
      reason: eventData.reason,
      deactivatedBy: eventData.deactivatedBy
    };
  }
}

export class UserLoginEvent implements IDomainEvent {
  public readonly eventType = 'UserLogin';
  public readonly aggregateType = 'User';
  public readonly version = 1;
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly data: any;

  constructor(eventData: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }) {
    this.aggregateId = eventData.userId;
    this.timestamp = new Date();
    this.data = {
      userId: eventData.userId,
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
      success: eventData.success
    };
  }
}

export class UserPasswordChangedEvent implements IDomainEvent {
  public readonly eventType = 'UserPasswordChanged';
  public readonly aggregateType = 'User';
  public readonly version = 1;
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly data: any;

  constructor(eventData: {
    userId: string;
    changeType: 'user_initiated' | 'admin_reset' | 'forced_reset';
    changedBy?: string;
  }) {
    this.aggregateId = eventData.userId;
    this.timestamp = new Date();
    this.data = {
      userId: eventData.userId,
      changeType: eventData.changeType,
      changedBy: eventData.changedBy
    };
  }
}