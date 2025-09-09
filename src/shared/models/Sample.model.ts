import { Schema, model, Document, Types } from 'mongoose';
import { 
  Sample, 
  SampleCollection, 
  SampleCollectionLocation, 
  SampleProcessing,
  SampleChainOfCustody
} from '../interfaces/Sample.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface SampleMongoDoc 
  extends Document,
    Omit<Sample, '_id' | 'caseId' | 'patientId' | 'testIds' | 'collectionInfo' | 'processing'> {
  caseId: Types.ObjectId;
  patientId: Types.ObjectId;
  testIds: Types.ObjectId[];
  collectionInfo: Omit<SampleCollection, 'collectedBy' | 'collectionLocation'> & {
    collectedBy: Types.ObjectId;
    collectionLocation: Omit<SampleCollectionLocation, 'facilityId'> & {
      facilityId?: Types.ObjectId;
    };
  };
  processing: Omit<SampleProcessing, 'receivedBy' | 'processedBy'> & {
    receivedBy?: Types.ObjectId;
    processedBy?: Types.ObjectId;
  };
  
  // Document methods
  generateSampleId(): Promise<string>;
  updateStatus(newStatus: Sample['status'], userId?: string): Promise<this>;
  addToChainOfCustody(action: string, performedBy: string, location?: string, notes?: string): Promise<void>;
  reject(reason: string, userId?: string): Promise<this>;
  markReceived(userId?: string): Promise<this>;
  markProcessing(userId?: string): Promise<this>;
  markCompleted(userId?: string): Promise<this>;
  checkExpiry(): boolean;
  getProcessingTime(): number;
}

// Chain of Custody Document interface
export interface SampleChainOfCustodyMongoDoc
  extends Document,
    Omit<SampleChainOfCustody, '_id' | 'sampleId' | 'performedBy'> {
  sampleId: Types.ObjectId;
  performedBy: Types.ObjectId;
}

// Embedded Schemas
const SampleCollectionLocationSchema = new Schema({
  facilityId: { type: Schema.Types.ObjectId },
  facilityType: { 
    type: String, 
    enum: ['hospital', 'lab', 'collectionCenter', 'clinic'] 
  },
  facilityName: String
}, { _id: false });

const SampleCollectionSchema = new Schema({
  collectedAt: { type: Date, required: true },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collectionLocation: { type: SampleCollectionLocationSchema, required: true },
  method: { 
    type: String, 
    enum: ['venipuncture', 'fingerstick', 'midstream', 'swab', 'other'] 
  },
  volume: String,
  containerType: String
}, { _id: false });

const SampleProcessingSchema = new Schema({
  receivedAt: Date,
  receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: Date,
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectionReason: { type: String, maxlength: 200 }
}, { _id: false });

const SampleStorageSchema = new Schema({
  location: String,
  temperature: String,
  expiryDate: Date
}, { _id: false });

const SampleQualityControlSchema = new Schema({
  haemolysis: { type: Boolean, default: false },
  lipemia: { type: Boolean, default: false },
  icterus: { type: Boolean, default: false },
  clotted: { type: Boolean, default: false },
  insufficient: { type: Boolean, default: false }
}, { _id: false });

// Main Sample Schema
const SampleSchema = new Schema<SampleMongoDoc>({
  sampleId: { 
    type: String, 
    match: /^SMP\d{8}$/,
    required: true
  },
  barcode: { type: String, sparse: true },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  testIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Test',
    required: true
  }],
  sampleType: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'saliva', 'tissue', 'swab', 'other'],
    required: true
  },
  collectionInfo: { type: SampleCollectionSchema, required: true },
  processing: { type: SampleProcessingSchema, required: true },
  storage: { type: SampleStorageSchema, required: true },
  status: {
    type: String,
    enum: ['collected', 'intransit', 'received', 'processing', 'completed', 'rejected', 'expired'],
    default: 'collected'
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  chainOfCustodyCount: { type: Number, default: 0, min: 0 },
  qualityControl: { type: SampleQualityControlSchema, required: true },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Chain of Custody Schema (separate collection)
const SampleChainOfCustodySchema = new Schema<SampleChainOfCustodyMongoDoc>({
  sampleId: { type: Schema.Types.ObjectId, ref: 'Sample', required: true },
  action: { type: String, required: true },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, required: true },
  location: String,
  temperature: String,
  notes: { type: String, maxlength: 500 },
  signature: String,
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Middleware
SampleSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    (this as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
});

// Methods
SampleSchema.methods['generateSampleId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('SMP', 'Sample', 'sampleId');
};

SampleSchema.methods['updateStatus'] = function(newStatus: Sample['status'], userId?: string) {
  const oldStatus = this['status'];
  this['status'] = newStatus;
  
  if (newStatus === 'received' && !this['processing'].receivedAt) {
    this['processing'].receivedAt = new Date();
    if (userId) {
      this['processing'].receivedBy = userId;
    }
  } else if (newStatus === 'processing' && !this['processing'].processedAt) {
    this['processing'].processedAt = new Date();
    if (userId) {
      this['processing'].processedBy = userId;
    }
  } else if (newStatus === 'rejected') {
    this['processing'].rejectedAt = new Date();
  }
  
  // Add to chain of custody
  const action = `Status changed from ${oldStatus} to ${newStatus}`;
  this['addToChainOfCustody'](action, userId || 'system');
  
  return this['save']();
};

SampleSchema.methods['addToChainOfCustody'] = async function(action: string, performedBy: string, location?: string, notes?: string) {
  const chainOfCustodyEntry = new SampleChainOfCustodyModel({
    sampleId: this['_id'],
    action,
    performedBy,
    timestamp: new Date(),
    location,
    notes
  });
  
  await chainOfCustodyEntry.save();
  
  this['chainOfCustodyCount'] += 1;
  await this['save']();
};

SampleSchema.methods['reject'] = function(reason: string, userId?: string) {
  this['processing'].rejectedAt = new Date();
  this['processing'].rejectionReason = reason;
  this['status'] = 'rejected';
  
  const action = `Sample rejected: ${reason}`;
  this['addToChainOfCustody'](action, userId || 'system');
  
  return this['save']();
};

SampleSchema.methods['markReceived'] = function(userId?: string) {
  return this['updateStatus']('received', userId);
};

SampleSchema.methods['markProcessing'] = function(userId?: string) {
  return this['updateStatus']('processing', userId);
};

SampleSchema.methods['markCompleted'] = function(userId?: string) {
  return this['updateStatus']('completed', userId);
};

SampleSchema.methods['checkExpiry'] = function(): boolean {
  if (!this['storage'].expiryDate) {
    return false;
  }
  
  const now = new Date();
  const isExpired = now > this['storage'].expiryDate;
  
  if (isExpired && this['status'] !== 'expired') {
    this['status'] = 'expired';
    this['addToChainOfCustody']('Sample expired', 'system');
    this['save']();
  }
  
  return isExpired;
};

SampleSchema.methods['getProcessingTime'] = function(): number {
  const collectedAt = this['collectionInfo'].collectedAt;
  const completedAt = this['processing'].processedAt || new Date();
  
  return completedAt.getTime() - collectedAt.getTime();
};

// Pre-save middleware for sampleId generation
SampleSchema.pre('save', async function() {
  if (this.isNew && !(this as unknown as { sampleId: string }).sampleId) {
    (this as unknown as { sampleId: string }).sampleId = await generateIdWithErrorHandling('SMP', 'Sample', 'sampleId');
  }
});

// Indexes for Sample
SampleSchema.index({ sampleId: 1 }, { unique: true });
SampleSchema.index({ barcode: 1 }, { unique: true, sparse: true });
SampleSchema.index({ caseId: 1 });
SampleSchema.index({ patientId: 1 });
SampleSchema.index({ status: 1, priority: 1 });
SampleSchema.index({ 'collectionInfo.collectedAt': 1 });
SampleSchema.index({ sampleId: 'text', barcode: 'text' });

// Indexes for Chain of Custody
SampleChainOfCustodySchema.index({ sampleId: 1, timestamp: -1 });
SampleChainOfCustodySchema.index({ performedBy: 1, timestamp: -1 });

export const SampleModel = model<SampleMongoDoc>('Sample', SampleSchema);
export const SampleChainOfCustodyModel = model<SampleChainOfCustodyMongoDoc>('SampleChainOfCustody', SampleChainOfCustodySchema);