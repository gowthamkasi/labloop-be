/**
 * Sample Model for LabLoop Healthcare System
 * Laboratory samples with comprehensive chain of custody tracking
 * HIPAA-compliant with audit logging and quality control
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  ISample,
  ISampleChainOfCustody,
  ISampleQuality,
  ISampleRejection,
  SampleStatus,
  SampleType,
  RejectionReason,
  CasePriority
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const sampleChainOfCustodySchema = new Schema<ISampleChainOfCustody>({
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
  },
  stage: {
    type: String,
    required: [true, 'Chain of custody stage is required'],
    enum: {
      values: ['collection', 'transit', 'receipt', 'storage', 'processing', 'disposal'],
      message: 'Invalid chain of custody stage',
    },
  },
  handledBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Handler is required for chain of custody'],
    ref: 'users',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
  },
  temperature: {
    type: Number,
    min: [-80, 'Temperature cannot be below -80°C'],
    max: [60, 'Temperature cannot exceed 60°C'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Chain of custody notes cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

const sampleQualitySchema = new Schema<ISampleQuality>({
  volume: {
    type: String,
    trim: true,
    maxlength: [50, 'Volume description cannot exceed 50 characters'],
  },
  appearance: {
    type: String,
    trim: true,
    maxlength: [200, 'Appearance description cannot exceed 200 characters'],
  },
  integrity: {
    type: String,
    required: [true, 'Sample integrity assessment is required'],
    enum: {
      values: ['good', 'acceptable', 'poor'],
      message: 'Sample integrity must be good, acceptable, or poor',
    },
  },
  temperature: {
    type: Number,
    min: [-80, 'Temperature cannot be below -80°C'],
    max: [60, 'Temperature cannot exceed 60°C'],
  },
  ph: {
    type: Number,
    min: [0, 'pH cannot be below 0'],
    max: [14, 'pH cannot exceed 14'],
  },
  notes: {
    type: String,
    maxlength: [500, 'Quality notes cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

const sampleRejectionSchema = new Schema<ISampleRejection>({
  isRejected: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
    enum: {
      values: ['insufficient', 'hemolyzed', 'clotted', 'contaminated', 'expired', 'improperStorage', 'other'] as RejectionReason[],
      message: 'Invalid rejection reason',
    },
    validate: {
      validator: function(this: ISampleRejection, reason: RejectionReason) {
        return !this.isRejected || !!reason;
      },
      message: 'Rejection reason is required when sample is rejected',
    },
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    validate: {
      validator: function(this: ISampleRejection, rejectedBy: Types.ObjectId) {
        return !this.isRejected || !!rejectedBy;
      },
      message: 'RejectedBy is required when sample is rejected',
    },
  },
  rejectedAt: {
    type: Date,
    validate: {
      validator: function(this: ISampleRejection, rejectedAt: Date) {
        return !this.isRejected || !!rejectedAt;
      },
      message: 'RejectedAt timestamp is required when sample is rejected',
    },
  },
  description: {
    type: String,
    maxlength: [1000, 'Rejection description cannot exceed 1000 characters'],
    trim: true,
    validate: {
      validator: function(this: ISampleRejection, description: string) {
        return !this.isRejected || (!!description && description.length > 10);
      },
      message: 'Detailed rejection description is required when sample is rejected',
    },
  },
  photos: {
    type: [String],
    validate: {
      validator: (photos: string[]) => photos.length <= 5,
      message: 'Cannot have more than 5 rejection photos',
    },
  },
}, { _id: false });

// ====================== MAIN SAMPLE SCHEMA ======================

const sampleSchema = new Schema<ISample>({
  sampleId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (sampleId: string) => /^SMP[0-9]{8}$/.test(sampleId),
      message: 'Sample ID must follow pattern SMP followed by 8 digits',
    },
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Barcode cannot exceed 50 characters'],
    validate: {
      validator: (barcode: string) => !barcode || /^[A-Z0-9]+$/.test(barcode),
      message: 'Barcode can only contain uppercase letters and numbers',
    },
  },
  caseId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Case ID is required'],
    ref: 'cases',
  },
  patientId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Patient ID is required'],
    ref: 'patients',
  },
  testIds: {
    type: [Schema.Types.ObjectId],
    required: [true, 'At least one test is required'],
    ref: 'tests',
    validate: {
      validator: (tests: Types.ObjectId[]) => tests.length > 0 && tests.length <= 20,
      message: 'Must have 1-20 tests for a sample',
    },
  },
  sampleType: {
    type: String,
    required: [true, 'Sample type is required'],
    enum: {
      values: ['blood', 'urine', 'stool', 'sputum', 'tissue', 'csf', 'other'] as SampleType[],
      message: 'Invalid sample type',
    },
  },
  containerType: {
    type: String,
    trim: true,
    maxlength: [100, 'Container type cannot exceed 100 characters'],
  },
  volume: {
    type: String,
    trim: true,
    maxlength: [50, 'Volume description cannot exceed 50 characters'],
  },
  priority: {
    type: String,
    required: [true, 'Sample priority is required'],
    enum: {
      values: ['routine', 'urgent', 'stat', 'critical'] as CasePriority[],
      message: 'Invalid sample priority',
    },
    default: 'routine',
  },
  status: {
    type: String,
    required: [true, 'Sample status is required'],
    enum: {
      values: ['collected', 'inTransit', 'received', 'processing', 'completed', 'rejected', 'insufficient'] as SampleStatus[],
      message: 'Invalid sample status',
    },
    default: 'collected',
  },
  collectedAt: {
    type: Date,
    required: [true, 'Collection timestamp is required'],
    validate: {
      validator: (date: Date) => date <= new Date(),
      message: 'Collection date cannot be in the future',
    },
  },
  collectedBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Collector is required'],
    ref: 'users',
  },
  collectionLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Collection location cannot exceed 200 characters'],
  },
  receivedAt: {
    type: Date,
    validate: {
      validator: function(this: ISample, date: Date) {
        return !date || date >= this.collectedAt;
      },
      message: 'Received date cannot be before collection date',
    },
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    validate: {
      validator: function(this: ISample, receivedBy: Types.ObjectId) {
        return !this.receivedAt || !!receivedBy;
      },
      message: 'ReceivedBy is required when sample is received',
    },
  },
  quality: {
    type: sampleQualitySchema,
    required: [true, 'Sample quality assessment is required'],
  },
  chainOfCustody: {
    type: [sampleChainOfCustodySchema],
    required: [true, 'Chain of custody tracking is required'],
    validate: {
      validator: (chain: ISampleChainOfCustody[]) => chain.length > 0 && chain.length <= 50,
      message: 'Chain of custody must have 1-50 entries',
    },
  },
  rejection: sampleRejectionSchema,
  storageLocation: {
    type: String,
    trim: true,
    maxlength: [100, 'Storage location cannot exceed 100 characters'],
  },
  storageConditions: {
    type: String,
    trim: true,
    maxlength: [200, 'Storage conditions cannot exceed 200 characters'],
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: (date: Date) => !date || date > new Date(),
      message: 'Expiry date must be in the future',
    },
  },
  labId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Lab ID is required'],
    ref: 'labs',
  },
  specialHandling: {
    type: [String],
    validate: {
      validator: (handling: string[]) => handling.length <= 10,
      message: 'Cannot have more than 10 special handling requirements',
    },
  },
  preservatives: {
    type: [String],
    validate: {
      validator: (preservatives: string[]) => preservatives.length <= 5,
      message: 'Cannot have more than 5 preservatives',
    },
  },
  notes: {
    type: String,
    maxlength: [2000, 'Sample notes cannot exceed 2000 characters'],
    trim: true,
  },
  metadata: {
    createdAt: { 
      type: Date, 
      default: Date.now,
      immutable: true,
    },
    updatedAt: { 
      type: Date, 
      default: Date.now,
    },
    deletedAt: { 
      type: Date, 
      sparse: true,
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'users',
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'users',
    },
    _id: false,
  },
}, {
  timestamps: false, // Using custom metadata timestamps
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: { 
    virtuals: true,
  },
});

// ====================== INDEXES ======================

// Unique indexes
sampleSchema.index({ sampleId: 1 }, { unique: true });
sampleSchema.index({ barcode: 1 }, { unique: true, sparse: true });

// Basic operational indexes
sampleSchema.index({ status: 1, priority: -1 });
sampleSchema.index({ sampleType: 1, status: 1 });
sampleSchema.index({ labId: 1, status: 1 });

// Relationship indexes
sampleSchema.index({ caseId: 1 });
sampleSchema.index({ patientId: 1 });
sampleSchema.index({ testIds: 1 });

// Collection and processing indexes
sampleSchema.index({ collectedBy: 1, collectedAt: -1 });
sampleSchema.index({ receivedBy: 1, receivedAt: -1 }, { sparse: true });
sampleSchema.index({ collectedAt: -1 });
sampleSchema.index({ receivedAt: -1 }, { sparse: true });

// Quality and rejection indexes
sampleSchema.index({ 'quality.integrity': 1 });
sampleSchema.index({ 'rejection.isRejected': 1 });
sampleSchema.index({ 'rejection.reason': 1 }, { sparse: true });

// Storage indexes
sampleSchema.index({ storageLocation: 1 }, { sparse: true });
sampleSchema.index({ expiryDate: 1 }, { sparse: true });

// Chain of custody indexes
sampleSchema.index({ 'chainOfCustody.handledBy': 1 });
sampleSchema.index({ 'chainOfCustody.stage': 1, 'chainOfCustody.timestamp': -1 });

// Text search index
sampleSchema.index({
  sampleId: 'text',
  barcode: 'text',
  notes: 'text',
  collectionLocation: 'text',
  storageLocation: 'text'
});

// Compound indexes for common queries
sampleSchema.index({ 
  labId: 1, 
  status: 1, 
  collectedAt: -1 
});
sampleSchema.index({ 
  caseId: 1, 
  sampleType: 1,
  status: 1 
});
sampleSchema.index({ 
  patientId: 1, 
  collectedAt: -1 
});
sampleSchema.index({ 
  priority: -1, 
  status: 1, 
  collectedAt: -1 
});

// Metadata indexes
sampleSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });
sampleSchema.index({ 'metadata.createdAt': -1 });

// ====================== VIRTUAL PROPERTIES ======================

sampleSchema.virtual('isRejected').get(function () {
  return this.rejection?.isRejected || false;
});

sampleSchema.virtual('isExpired').get(function () {
  return this.expiryDate && this.expiryDate < new Date();
});

sampleSchema.virtual('isReceived').get(function () {
  return !!this.receivedAt;
});

sampleSchema.virtual('processingTime').get(function () {
  if (!this.receivedAt) return null;
  const now = new Date();
  return Math.floor((now.getTime() - this.receivedAt.getTime()) / (1000 * 60 * 60)); // hours
});

sampleSchema.virtual('transitTime').get(function () {
  if (!this.receivedAt || !this.collectedAt) return null;
  return Math.floor((this.receivedAt.getTime() - this.collectedAt.getTime()) / (1000 * 60 * 60)); // hours
});

sampleSchema.virtual('testCount').get(function () {
  return this.testIds?.length || 0;
});

sampleSchema.virtual('daysSinceCollection').get(function () {
  const now = new Date();
  return Math.floor((now.getTime() - this.collectedAt.getTime()) / (1000 * 60 * 60 * 24));
});

sampleSchema.virtual('lastChainOfCustodyEntry').get(function () {
  if (!this.chainOfCustody || this.chainOfCustody.length === 0) return null;
  return this.chainOfCustody[this.chainOfCustody.length - 1];
});

sampleSchema.virtual('requiresSpecialHandling').get(function () {
  return this.specialHandling && this.specialHandling.length > 0;
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
sampleSchema.pre('save', async function (next) {
  // Auto-generate sampleId if not provided
  if (this.isNew && !this.sampleId) {
    this.sampleId = await generateSampleId();
  }

  // Auto-generate barcode if not provided
  if (this.isNew && !this.barcode) {
    this.barcode = await generateSampleBarcode();
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Add initial chain of custody entry if new
  if (this.isNew && this.chainOfCustody.length === 0) {
    this.chainOfCustody.push({
      timestamp: this.collectedAt,
      stage: 'collection',
      handledBy: this.collectedBy,
      location: this.collectionLocation || 'Unknown',
    });
  }

  // Add chain of custody entry when status changes
  if (this.isModified('status') && !this.isNew) {
    const statusToStageMap: Record<string, string> = {
      'inTransit': 'transit',
      'received': 'receipt',
      'processing': 'processing',
    };
    
    const stage = statusToStageMap[this.status];
    if (stage) {
      const lastEntry = this.chainOfCustody[this.chainOfCustody.length - 1];
      if (!lastEntry || lastEntry.stage !== stage) {
        this.chainOfCustody.push({
          timestamp: new Date(),
          stage: stage as any,
          handledBy: this.metadata.updatedBy || this.collectedBy,
          location: this.storageLocation || 'Lab',
        });
      }
    }
  }

  // Set receivedAt when status changes to received
  if (this.isModified('status') && this.status === 'received' && !this.receivedAt) {
    this.receivedAt = new Date();
    this.receivedBy = this.metadata.updatedBy || this.collectedBy;
  }

  // Validate rejection logic
  if (this.rejection?.isRejected) {
    if (!this.rejection.reason || !this.rejection.rejectedBy || !this.rejection.rejectedAt) {
      this.rejection.rejectedAt = new Date();
      this.rejection.rejectedBy = this.metadata.updatedBy || this.collectedBy;
    }
    
    if (this.status !== 'rejected') {
      this.status = 'rejected';
    }
  }

  next();
});

// Pre-validate middleware
sampleSchema.pre('validate', function (next) {
  // Validate expiry date for certain sample types
  if (['blood', 'urine'].includes(this.sampleType) && !this.expiryDate) {
    const expiryHours = this.sampleType === 'blood' ? 72 : 24; // 3 days for blood, 1 day for urine
    this.expiryDate = new Date(this.collectedAt.getTime() + (expiryHours * 60 * 60 * 1000));
  }

  // Ensure chain of custody has at least collection entry
  if (this.chainOfCustody.length === 0) {
    this.chainOfCustody.push({
      timestamp: this.collectedAt,
      stage: 'collection',
      handledBy: this.collectedBy,
      location: this.collectionLocation || 'Collection Site',
    });
  }

  next();
});

// Post-save middleware for logging
sampleSchema.post('save', function (doc, next) {
  console.log(`Sample ${doc.sampleId} (${doc.sampleType}) has been saved with status: ${doc.status}`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
sampleSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

sampleSchema.methods.addChainOfCustodyEntry = function (entry: Omit<ISampleChainOfCustody, 'timestamp'>) {
  this.chainOfCustody.push({
    ...entry,
    timestamp: new Date(),
  });
  return this.save();
};

sampleSchema.methods.reject = function (
  reason: RejectionReason,
  description: string,
  rejectedBy: Types.ObjectId,
  photos?: string[]
) {
  this.status = 'rejected';
  this.rejection = {
    isRejected: true,
    reason,
    description,
    rejectedBy,
    rejectedAt: new Date(),
    photos: photos || [],
  };
  return this.save();
};

sampleSchema.methods.updateStatus = function (
  newStatus: SampleStatus,
  updatedBy?: Types.ObjectId,
  location?: string
) {
  const previousStatus = this.status;
  this.status = newStatus;
  
  if (updatedBy) {
    this.metadata.updatedBy = updatedBy;
  }
  
  // Add chain of custody entry for status change
  const statusToStageMap: Record<string, string> = {
    'inTransit': 'transit',
    'received': 'receipt',
    'processing': 'processing',
    'completed': 'processing', // Final processing stage
  };
  
  const stage = statusToStageMap[newStatus];
  if (stage) {
    this.chainOfCustody.push({
      timestamp: new Date(),
      stage: stage as any,
      handledBy: updatedBy || this.collectedBy,
      location: location || this.storageLocation || 'Lab',
    });
  }
  
  return this.save();
};

sampleSchema.methods.updateQuality = function (quality: Partial<ISampleQuality>) {
  this.quality = { ...this.quality, ...quality };
  
  // Auto-reject if quality is poor
  if (quality.integrity === 'poor' && !this.rejection?.isRejected) {
    this.rejection = {
      isRejected: true,
      reason: 'other',
      description: 'Sample rejected due to poor quality integrity',
      rejectedBy: this.metadata.updatedBy || this.collectedBy,
      rejectedAt: new Date(),
    };
    this.status = 'rejected';
  }
  
  return this.save();
};

sampleSchema.methods.addTest = function (testId: Types.ObjectId) {
  if (!this.testIds.includes(testId) && this.testIds.length < 20) {
    this.testIds.push(testId);
    return this.save();
  }
  return Promise.resolve(this);
};

sampleSchema.methods.removeTest = function (testId: Types.ObjectId) {
  this.testIds = this.testIds.filter(id => !id.equals(testId));
  return this.save();
};

sampleSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

sampleSchema.statics.findBySampleId = function (sampleId: string) {
  return this.findOne({ sampleId });
};

sampleSchema.statics.findByBarcode = function (barcode: string) {
  return this.findOne({ barcode: barcode.toUpperCase() });
};

sampleSchema.statics.findByCase = function (caseId: Types.ObjectId) {
  return this.find({ caseId });
};

sampleSchema.statics.findByPatient = function (patientId: Types.ObjectId) {
  return this.find({ patientId });
};

sampleSchema.statics.findByLab = function (labId: Types.ObjectId, status?: SampleStatus) {
  const query: any = { labId };
  if (status) query.status = status;
  return this.find(query);
};

sampleSchema.statics.findByStatus = function (status: SampleStatus) {
  return this.find({ status });
};

sampleSchema.statics.findByType = function (sampleType: SampleType) {
  return this.find({ sampleType });
};

sampleSchema.statics.findRejected = function () {
  return this.find({ 'rejection.isRejected': true });
};

sampleSchema.statics.findExpired = function () {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $nin: ['completed', 'rejected'] }
  });
};

sampleSchema.statics.findByCollector = function (collectorId: Types.ObjectId, dateRange?: { start: Date; end: Date }) {
  const query: any = { collectedBy: collectorId };
  
  if (dateRange) {
    query.collectedAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  
  return this.find(query);
};

// ====================== HELPER FUNCTIONS ======================

async function generateSampleId(): Promise<string> {
  const Sample = model<ISample>('Sample');
  let sampleId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    sampleId = `SMP${timestamp.slice(-5)}${random}`;
    exists = await Sample.exists({ sampleId });
  } while (exists);

  return sampleId;
}

async function generateSampleBarcode(): Promise<string> {
  const Sample = model<ISample>('Sample');
  let barcode: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    barcode = `${timestamp.slice(-8)}${random}`;
    exists = await Sample.exists({ barcode });
  } while (exists);

  return barcode;
}

// ====================== MODEL EXPORT ======================

export const Sample: Model<ISample> = model<ISample>('Sample', sampleSchema);
export default Sample;