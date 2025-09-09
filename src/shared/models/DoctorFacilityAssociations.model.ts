import { Schema, model, Document, Types } from 'mongoose';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// Interfaces
export interface DoctorFacilitySchedule {
  days: string[];
  timings?: string;
  slotsPerDay?: number;
}

export interface DoctorFacilityPrivileges {
  admitting: boolean;
  operating: boolean;
  emergency: boolean;
  consulting: boolean;
}

export interface DoctorFacilityFees {
  consultation?: number;
  followUp?: number;
  emergency?: number;
  procedure?: number;
}

export interface DoctorFacilityAssociation {
  _id: Types.ObjectId;
  associationId: string;
  doctorId: Types.ObjectId;
  facilityId: Types.ObjectId;
  facilityType: 'hospital' | 'lab' | 'clinic';
  associationType: 'fullTime' | 'partTime' | 'visiting' | 'consultant' | 'onCall';
  department?: string;
  designation?: string;
  schedule: DoctorFacilitySchedule;
  privileges: DoctorFacilityPrivileges;
  fees: DoctorFacilityFees;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface DoctorFacilityAssociationMongoDoc 
  extends Document, 
    Omit<DoctorFacilityAssociation, '_id'> {
  
  // Document methods
  generateAssociationId(): Promise<string>;
  activate(): Promise<this>;
  deactivate(): Promise<this>;
  updateSchedule(schedule: Partial<DoctorFacilitySchedule>): Promise<this>;
  updatePrivileges(privileges: Partial<DoctorFacilityPrivileges>): Promise<this>;
  updateFees(fees: Partial<DoctorFacilityFees>): Promise<this>;
  isValid(): boolean;
  hasPrivilege(privilege: keyof DoctorFacilityPrivileges): boolean;
}

// Embedded Schemas
const DoctorFacilityScheduleSchema = new Schema<DoctorFacilitySchedule>({
  days: {
    type: [String],
    default: []
  },
  timings: String,
  slotsPerDay: Number
}, { _id: false });

const DoctorFacilityPrivilegesSchema = new Schema<DoctorFacilityPrivileges>({
  admitting: { type: Boolean, default: false },
  operating: { type: Boolean, default: false },
  emergency: { type: Boolean, default: false },
  consulting: { type: Boolean, default: true }
}, { _id: false });

const DoctorFacilityFeesSchema = new Schema<DoctorFacilityFees>({
  consultation: Number,
  followUp: Number,
  emergency: Number,
  procedure: Number
}, { _id: false });

// Main Schema
const DoctorFacilityAssociationSchema = new Schema<DoctorFacilityAssociationMongoDoc>({
  associationId: { 
    type: String, 
    match: /^DFA\d{8}$/,
    required: true
  },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  facilityId: { type: Schema.Types.ObjectId, required: true },
  facilityType: {
    type: String,
    enum: ['hospital', 'lab', 'clinic'],
    required: true
  },
  associationType: {
    type: String,
    enum: ['fullTime', 'partTime', 'visiting', 'consultant', 'onCall'],
    required: true
  },
  department: String,
  designation: String,
  schedule: { type: DoctorFacilityScheduleSchema, required: true },
  privileges: { type: DoctorFacilityPrivilegesSchema, required: true },
  fees: { type: DoctorFacilityFeesSchema, required: true },
  validFrom: { type: Date, required: true },
  validUntil: Date,
  isActive: { type: Boolean, default: true },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
DoctorFacilityAssociationSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
DoctorFacilityAssociationSchema.methods['generateAssociationId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('DFA', 'DoctorFacilityAssociation', 'associationId');
};

DoctorFacilityAssociationSchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

DoctorFacilityAssociationSchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

DoctorFacilityAssociationSchema.methods['updateSchedule'] = function(schedule: Partial<DoctorFacilitySchedule>) {
  Object.assign(this['schedule'], schedule);
  return this['save']();
};

DoctorFacilityAssociationSchema.methods['updatePrivileges'] = function(privileges: Partial<DoctorFacilityPrivileges>) {
  Object.assign(this['privileges'], privileges);
  return this['save']();
};

DoctorFacilityAssociationSchema.methods['updateFees'] = function(fees: Partial<DoctorFacilityFees>) {
  Object.assign(this['fees'], fees);
  return this['save']();
};

DoctorFacilityAssociationSchema.methods['isValid'] = function(): boolean {
  const now = new Date();
  const validFrom = this['validFrom'];
  const validUntil = this['validUntil'];
  
  if (validFrom > now) return false;
  if (validUntil && validUntil < now) return false;
  
  return this['isActive'];
};

DoctorFacilityAssociationSchema.methods['hasPrivilege'] = function(privilege: keyof DoctorFacilityPrivileges): boolean {
  return this['privileges'][privilege] === true;
};

// Pre-save middleware for associationId generation
DoctorFacilityAssociationSchema.pre('save', async function() {
  if (this.isNew && !this['associationId']) {
    this['associationId'] = await generateIdWithErrorHandling('DFA', 'DoctorFacilityAssociation', 'associationId');
  }
});

// Indexes
DoctorFacilityAssociationSchema.index({ associationId: 1 }, { unique: true });
DoctorFacilityAssociationSchema.index({ doctorId: 1, facilityId: 1, facilityType: 1 }, { unique: true });
DoctorFacilityAssociationSchema.index({ doctorId: 1, isActive: 1 });
DoctorFacilityAssociationSchema.index({ facilityId: 1, facilityType: 1, isActive: 1 });
DoctorFacilityAssociationSchema.index({ validFrom: 1, validUntil: 1 });

export const DoctorFacilityAssociationModel = model<DoctorFacilityAssociationMongoDoc>('DoctorFacilityAssociation', DoctorFacilityAssociationSchema);