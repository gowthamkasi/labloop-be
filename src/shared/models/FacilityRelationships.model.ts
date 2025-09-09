import { Schema, model, Document, Types } from 'mongoose';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// Interfaces
export interface FacilityInfo {
  id: Types.ObjectId;
  type: 'hospital' | 'lab' | 'collectionCenter';
  name: string;
}

export interface FacilityAgreement {
  contractNumber?: string;
  startDate: Date;
  endDate?: Date;
  revenueSharingPercentage?: number;
  terms?: string;
}

export interface FacilityOperationalDetails {
  sampleTransferFrequency?: string;
  reportingSLA?: number;
  qualityAudits: boolean;
}

export interface FacilityRelationship {
  _id: Types.ObjectId;
  relationshipId: string;
  parentFacility: FacilityInfo;
  childFacility: FacilityInfo;
  relationshipType: 'owned' | 'operated' | 'affiliated' | 'contracted' | 'preferred';
  agreement: FacilityAgreement;
  operationalDetails: FacilityOperationalDetails;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface FacilityRelationshipMongoDoc 
  extends Document, 
    Omit<FacilityRelationship, '_id'> {
  
  // Document methods
  generateRelationshipId(): Promise<string>;
  activate(): Promise<this>;
  deactivate(): Promise<this>;
  updateAgreement(agreement: Partial<FacilityAgreement>): Promise<this>;
  updateOperationalDetails(details: Partial<FacilityOperationalDetails>): Promise<this>;
  isValidRelationship(): boolean;
  isContractActive(): boolean;
}

// Embedded Schemas
const FacilityInfoSchema = new Schema<FacilityInfo>({
  id: { type: Schema.Types.ObjectId, required: true },
  type: {
    type: String,
    enum: ['hospital', 'lab', 'collectionCenter'],
    required: true
  },
  name: { type: String, required: true }
}, { _id: false });

const FacilityAgreementSchema = new Schema<FacilityAgreement>({
  contractNumber: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  revenueSharingPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  terms: { type: String, maxlength: 2000 }
}, { _id: false });

const FacilityOperationalDetailsSchema = new Schema<FacilityOperationalDetails>({
  sampleTransferFrequency: String,
  reportingSLA: {
    type: Number,
    min: 0
  },
  qualityAudits: { type: Boolean, default: false }
}, { _id: false });

// Main Schema
const FacilityRelationshipSchema = new Schema<FacilityRelationshipMongoDoc>({
  relationshipId: { 
    type: String, 
    match: /^FRL\d{8}$/,
    required: true
  },
  parentFacility: { type: FacilityInfoSchema, required: true },
  childFacility: { type: FacilityInfoSchema, required: true },
  relationshipType: {
    type: String,
    enum: ['owned', 'operated', 'affiliated', 'contracted', 'preferred'],
    required: true
  },
  agreement: { type: FacilityAgreementSchema, required: true },
  operationalDetails: { type: FacilityOperationalDetailsSchema, required: true },
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
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
FacilityRelationshipSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
FacilityRelationshipSchema.methods['generateRelationshipId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('FRL', 'FacilityRelationship', 'relationshipId');
};

FacilityRelationshipSchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

FacilityRelationshipSchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

FacilityRelationshipSchema.methods['updateAgreement'] = function(agreement: Partial<FacilityAgreement>) {
  Object.assign(this['agreement'], agreement);
  return this['save']();
};

FacilityRelationshipSchema.methods['updateOperationalDetails'] = function(details: Partial<FacilityOperationalDetails>) {
  Object.assign(this['operationalDetails'], details);
  return this['save']();
};

FacilityRelationshipSchema.methods['isValidRelationship'] = function(): boolean {
  return this['isActive'] && this['isContractActive']();
};

FacilityRelationshipSchema.methods['isContractActive'] = function(): boolean {
  const now = new Date();
  const startDate = this['agreement'].startDate;
  const endDate = this['agreement'].endDate;
  
  if (startDate > now) return false;
  if (endDate && endDate < now) return false;
  
  return true;
};

// Validation
FacilityRelationshipSchema.pre('save', function() {
  // Validate relationship logic
  const parentType = this['parentFacility'].type;
  const childType = this['childFacility'].type;
  
  // Business logic validation
  if (parentType === 'hospital' && !['lab', 'collectionCenter'].includes(childType)) {
    throw new Error('Hospital can only have lab or collectionCenter as child');
  }
  
  if (parentType === 'lab' && childType !== 'collectionCenter') {
    throw new Error('Lab can only have collectionCenter as child');
  }
});

// Pre-save middleware for relationshipId generation
FacilityRelationshipSchema.pre('save', async function() {
  if (this.isNew && !this['relationshipId']) {
    this['relationshipId'] = await generateIdWithErrorHandling('FRL', 'FacilityRelationship', 'relationshipId');
  }
});

// Indexes
FacilityRelationshipSchema.index({ relationshipId: 1 }, { unique: true });
FacilityRelationshipSchema.index({ 'parentFacility.id': 1, 'childFacility.id': 1 }, { unique: true });
FacilityRelationshipSchema.index({ 'parentFacility.id': 1, isActive: 1 });
FacilityRelationshipSchema.index({ 'childFacility.id': 1, isActive: 1 });
FacilityRelationshipSchema.index({ relationshipType: 1, isActive: 1 });
FacilityRelationshipSchema.index({ 'agreement.startDate': 1, 'agreement.endDate': 1 });

export const FacilityRelationshipModel = model<FacilityRelationshipMongoDoc>('FacilityRelationship', FacilityRelationshipSchema);