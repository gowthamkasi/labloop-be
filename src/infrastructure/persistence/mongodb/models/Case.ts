/**
 * Case Model for LabLoop Healthcare System
 * Central workflow entity for managing patient lab cases with comprehensive tracking
 * HIPAA-compliant with audit logging and workflow state management
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  ICase,
  ICasePatient,
  ICasePhysician,
  ICaseBilling,
  ICaseWorkflow,
  CaseStatus,
  CasePriority,
  PaymentStatus,
  Gender
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const casePatientSchema = new Schema<ICasePatient>({
  patientId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Patient ID is required'],
    ref: 'patients',
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Patient name cannot exceed 100 characters'],
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150 years'],
  },
  gender: {
    type: String,
    required: [true, 'Patient gender is required'],
    enum: {
      values: ['male', 'female', 'other'] as Gender[],
      message: 'Gender must be male, female, or other',
    },
  },
  contact: {
    type: String,
    required: [true, 'Patient contact is required'],
    validate: {
      validator: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Please provide a valid contact number',
    },
  },
}, { _id: false });

const casePhysicianSchema = new Schema<ICasePhysician>({
  physicianId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    sparse: true,
  },
  name: {
    type: String,
    required: [true, 'Physician name is required'],
    trim: true,
    maxlength: [100, 'Physician name cannot exceed 100 characters'],
  },
  contact: {
    type: String,
    validate: {
      validator: (phone: string) => !phone || /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Physician contact must be a valid phone number',
    },
  },
  licenseNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'License number cannot exceed 50 characters'],
  },
  specialization: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters'],
  },
}, { _id: false });

const caseBillingSchema = new Schema<ICaseBilling>({
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
  finalAmount: {
    type: Number,
    required: [true, 'Final amount is required'],
    min: [0, 'Final amount cannot be negative'],
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Advance amount cannot be negative'],
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Balance amount cannot be negative'],
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netBanking', 'wallet', 'insurance', 'credit'],
  },
  invoiceNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters'],
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'partial', 'paid', 'refunded', 'cancelled'] as PaymentStatus[],
      message: 'Invalid payment status',
    },
    default: 'pending',
  },
}, { _id: false });

const workflowStageSchema = new Schema({
  stage: {
    type: String,
    required: [true, 'Stage is required'],
    enum: {
      values: ['draft', 'confirmed', 'sampleCollected', 'inProgress', 'completed', 'cancelled', 'onHold'] as CaseStatus[],
      message: 'Invalid workflow stage',
    },
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
  },
  completedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  notes: {
    type: String,
    maxlength: [500, 'Stage notes cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

const caseWorkflowSchema = new Schema<ICaseWorkflow>({
  currentStage: {
    type: String,
    required: [true, 'Current stage is required'],
    enum: {
      values: ['draft', 'confirmed', 'sampleCollected', 'inProgress', 'completed', 'cancelled', 'onHold'] as CaseStatus[],
      message: 'Invalid current stage',
    },
    default: 'draft',
  },
  stages: {
    type: [workflowStageSchema],
    default: [],
    validate: {
      validator: (stages: any[]) => stages.length <= 20,
      message: 'Cannot have more than 20 workflow stages',
    },
  },
  estimatedCompletion: {
    type: Date,
    validate: {
      validator: (date: Date) => !date || date > new Date(),
      message: 'Estimated completion must be in the future',
    },
  },
  actualCompletion: {
    type: Date,
    validate: {
      validator: function(this: ICaseWorkflow, date: Date) {
        return !date || this.currentStage === 'completed';
      },
      message: 'Actual completion can only be set when case is completed',
    },
  },
}, { _id: false });

// ====================== MAIN CASE SCHEMA ======================

const caseSchema = new Schema<ICase>({
  caseId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (caseId: string) => /^CASE[0-9]{6}$/.test(caseId),
      message: 'Case ID must follow pattern CASE followed by 6 digits',
    },
  },
  caseNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Case number cannot exceed 50 characters'],
  },
  patient: {
    type: casePatientSchema,
    required: [true, 'Patient information is required'],
  },
  physician: casePhysicianSchema,
  labId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Lab ID is required'],
    ref: 'labs',
  },
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'hospitals',
    sparse: true,
  },
  testIds: {
    type: [Schema.Types.ObjectId],
    required: [true, 'At least one test is required'],
    ref: 'tests',
    validate: {
      validator: (tests: Types.ObjectId[]) => tests.length > 0 && tests.length <= 50,
      message: 'Must have 1-50 tests in a case',
    },
  },
  sampleIds: {
    type: [Schema.Types.ObjectId],
    ref: 'samples',
    validate: {
      validator: (samples: Types.ObjectId[]) => samples.length <= 20,
      message: 'Cannot have more than 20 samples in a case',
    },
  },
  appointmentId: {
    type: Schema.Types.ObjectId,
    ref: 'appointments',
    sparse: true,
  },
  reportIds: {
    type: [Schema.Types.ObjectId],
    ref: 'reports',
    validate: {
      validator: (reports: Types.ObjectId[]) => reports.length <= 10,
      message: 'Cannot have more than 10 reports in a case',
    },
  },
  priority: {
    type: String,
    required: [true, 'Case priority is required'],
    enum: {
      values: ['routine', 'urgent', 'stat', 'critical'] as CasePriority[],
      message: 'Invalid case priority',
    },
    default: 'routine',
  },
  status: {
    type: String,
    required: [true, 'Case status is required'],
    enum: {
      values: ['draft', 'confirmed', 'sampleCollected', 'inProgress', 'completed', 'cancelled', 'onHold'] as CaseStatus[],
      message: 'Invalid case status',
    },
    default: 'draft',
  },
  workflow: {
    type: caseWorkflowSchema,
    required: [true, 'Workflow information is required'],
  },
  billing: {
    type: caseBillingSchema,
    required: [true, 'Billing information is required'],
  },
  clinicalHistory: {
    type: String,
    maxlength: [2000, 'Clinical history cannot exceed 2000 characters'],
    trim: true,
  },
  provisionalDiagnosis: {
    type: String,
    maxlength: [500, 'Provisional diagnosis cannot exceed 500 characters'],
    trim: true,
  },
  specialInstructions: {
    type: String,
    maxlength: [1000, 'Special instructions cannot exceed 1000 characters'],
    trim: true,
  },
  internalNotes: {
    type: String,
    maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
    trim: true,
  },
  collectionDate: {
    type: Date,
    validate: {
      validator: function(this: ICase, date: Date) {
        return !date || this.status !== 'draft';
      },
      message: 'Collection date can only be set after case is confirmed',
    },
  },
  expectedReportDate: {
    type: Date,
    validate: {
      validator: (date: Date) => !date || date > new Date(),
      message: 'Expected report date must be in the future',
    },
  },
  tags: {
    type: [String],
    validate: {
      validator: (tags: string[]) => tags.length <= 10,
      message: 'Cannot have more than 10 tags',
    },
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
caseSchema.index({ caseId: 1 }, { unique: true });
caseSchema.index({ caseNumber: 1 }, { unique: true, sparse: true });

// Basic operational indexes
caseSchema.index({ status: 1, priority: -1 });
caseSchema.index({ labId: 1, status: 1 });
caseSchema.index({ 'patient.patientId': 1, status: 1 });

// Relationship indexes
caseSchema.index({ hospitalId: 1 }, { sparse: true });
caseSchema.index({ appointmentId: 1 }, { sparse: true });
caseSchema.index({ testIds: 1 });
caseSchema.index({ sampleIds: 1 }, { sparse: true });
caseSchema.index({ reportIds: 1 }, { sparse: true });

// Workflow indexes
caseSchema.index({ 'workflow.currentStage': 1 });
caseSchema.index({ 'workflow.estimatedCompletion': 1 });
caseSchema.index({ 'workflow.actualCompletion': 1 }, { sparse: true });

// Billing indexes
caseSchema.index({ 'billing.paymentStatus': 1 });
caseSchema.index({ 'billing.finalAmount': 1 });

// Date indexes
caseSchema.index({ collectionDate: 1 }, { sparse: true });
caseSchema.index({ expectedReportDate: 1 }, { sparse: true });

// Physician indexes
caseSchema.index({ 'physician.physicianId': 1 }, { sparse: true });

// Text search index
caseSchema.index({
  caseId: 'text',
  caseNumber: 'text',
  'patient.name': 'text',
  'physician.name': 'text',
  clinicalHistory: 'text',
  provisionalDiagnosis: 'text'
});

// Compound indexes for common queries
caseSchema.index({ 
  labId: 1, 
  status: 1, 
  priority: -1,
  'metadata.createdAt': -1 
});
caseSchema.index({ 
  'patient.patientId': 1, 
  status: 1,
  'metadata.createdAt': -1 
});
caseSchema.index({ 
  status: 1, 
  collectionDate: 1 
});

// Metadata indexes
caseSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });
caseSchema.index({ 'metadata.createdAt': -1 });

// ====================== VIRTUAL PROPERTIES ======================

caseSchema.virtual('isActive').get(function () {
  return !['completed', 'cancelled'].includes(this.status);
});

caseSchema.virtual('isOverdue').get(function () {
  return this.expectedReportDate && this.expectedReportDate < new Date() && this.status !== 'completed';
});

caseSchema.virtual('daysSinceCreation').get(function () {
  const now = new Date();
  const created = this.metadata.createdAt;
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
});

caseSchema.virtual('testCount').get(function () {
  return this.testIds?.length || 0;
});

caseSchema.virtual('sampleCount').get(function () {
  return this.sampleIds?.length || 0;
});

caseSchema.virtual('reportCount').get(function () {
  return this.reportIds?.length || 0;
});

caseSchema.virtual('isPaid').get(function () {
  return this.billing.paymentStatus === 'paid';
});

caseSchema.virtual('hasPhysician').get(function () {
  return !!(this.physician && this.physician.name);
});

caseSchema.virtual('currentWorkflowStage').get(function () {
  return this.workflow.stages.find(stage => stage.stage === this.workflow.currentStage);
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
caseSchema.pre('save', async function (next) {
  // Auto-generate caseId if not provided
  if (this.isNew && !this.caseId) {
    this.caseId = await generateCaseId();
  }

  // Auto-generate caseNumber if not provided
  if (this.isNew && !this.caseNumber) {
    this.caseNumber = await generateCaseNumber(this.labId);
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Sync status with workflow current stage
  if (this.isModified('status') || this.isModified('workflow.currentStage')) {
    if (this.status !== this.workflow.currentStage) {
      this.workflow.currentStage = this.status;
    }
  }

  // Calculate billing amounts
  if (this.isModified('billing')) {
    this.billing.finalAmount = this.billing.totalAmount - this.billing.discountAmount;
    this.billing.balanceAmount = this.billing.finalAmount - (this.billing.advanceAmount || 0);
  }

  // Add workflow stage entry if status changed
  if (this.isModified('status') && !this.isNew) {
    const existingStage = this.workflow.stages.find(stage => stage.stage === this.status);
    if (!existingStage) {
      this.workflow.stages.push({
        stage: this.status,
        timestamp: new Date(),
        completedBy: this.metadata.updatedBy,
      } as any);
    }
  }

  // Set actual completion date when completed
  if (this.status === 'completed' && !this.workflow.actualCompletion) {
    this.workflow.actualCompletion = new Date();
  }

  next();
});

// Pre-validate middleware
caseSchema.pre('validate', function (next) {
  // Validate billing calculations
  if (this.billing) {
    const expectedFinal = this.billing.totalAmount - this.billing.discountAmount;
    if (Math.abs(this.billing.finalAmount - expectedFinal) > 0.01) {
      this.billing.finalAmount = expectedFinal;
    }
  }

  // Ensure at least one workflow stage exists
  if (this.workflow && this.workflow.stages.length === 0) {
    this.workflow.stages.push({
      stage: this.status,
      timestamp: new Date(),
    } as any);
  }

  next();
});

// Post-save middleware for logging
caseSchema.post('save', function (doc, next) {
  console.log(`Case ${doc.caseId} for patient ${doc.patient.name} has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
caseSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

caseSchema.methods.addTest = function (testId: Types.ObjectId) {
  if (!this.testIds.includes(testId) && this.testIds.length < 50) {
    this.testIds.push(testId);
    return this.save();
  }
  return Promise.resolve(this);
};

caseSchema.methods.removeTest = function (testId: Types.ObjectId) {
  this.testIds = this.testIds.filter(id => !id.equals(testId));
  return this.save();
};

caseSchema.methods.addSample = function (sampleId: Types.ObjectId) {
  if (!this.sampleIds) this.sampleIds = [];
  if (!this.sampleIds.includes(sampleId) && this.sampleIds.length < 20) {
    this.sampleIds.push(sampleId);
    return this.save();
  }
  return Promise.resolve(this);
};

caseSchema.methods.addReport = function (reportId: Types.ObjectId) {
  if (!this.reportIds) this.reportIds = [];
  if (!this.reportIds.includes(reportId) && this.reportIds.length < 10) {
    this.reportIds.push(reportId);
    return this.save();
  }
  return Promise.resolve(this);
};

caseSchema.methods.updateStatus = function (newStatus: CaseStatus, updatedBy?: Types.ObjectId, notes?: string) {
  const previousStatus = this.status;
  this.status = newStatus;
  this.workflow.currentStage = newStatus;
  
  // Add workflow stage entry
  const stageExists = this.workflow.stages.some(stage => stage.stage === newStatus);
  if (!stageExists) {
    this.workflow.stages.push({
      stage: newStatus,
      timestamp: new Date(),
      completedBy: updatedBy,
      notes,
    } as any);
  }
  
  if (updatedBy) {
    this.metadata.updatedBy = updatedBy;
  }
  
  return this.save();
};

caseSchema.methods.updateBilling = function (billingUpdate: Partial<ICaseBilling>) {
  this.billing = { ...this.billing, ...billingUpdate };
  
  // Recalculate amounts
  this.billing.finalAmount = this.billing.totalAmount - this.billing.discountAmount;
  this.billing.balanceAmount = this.billing.finalAmount - (this.billing.advanceAmount || 0);
  
  return this.save();
};

caseSchema.methods.markAsPaid = function (paymentMode?: string) {
  this.billing.paymentStatus = 'paid';
  this.billing.balanceAmount = 0;
  if (paymentMode) {
    this.billing.paymentMode = paymentMode;
  }
  return this.save();
};

caseSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

caseSchema.statics.findByCaseId = function (caseId: string) {
  return this.findOne({ caseId });
};

caseSchema.statics.findByCaseNumber = function (caseNumber: string) {
  return this.findOne({ caseNumber });
};

caseSchema.statics.findByPatient = function (patientId: Types.ObjectId) {
  return this.find({ 'patient.patientId': patientId });
};

caseSchema.statics.findByLab = function (labId: Types.ObjectId, status?: CaseStatus) {
  const query: any = { labId };
  if (status) query.status = status;
  return this.find(query);
};

caseSchema.statics.findByStatus = function (status: CaseStatus) {
  return this.find({ status });
};

caseSchema.statics.findByPriority = function (priority: CasePriority) {
  return this.find({ priority, status: { $ne: 'completed' } });
};

caseSchema.statics.findOverdue = function () {
  return this.find({
    expectedReportDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

caseSchema.statics.findPendingPayment = function () {
  return this.find({
    'billing.paymentStatus': { $in: ['pending', 'partial'] }
  });
};

// ====================== HELPER FUNCTIONS ======================

async function generateCaseId(): Promise<string> {
  const Case = model<ICase>('Case');
  let caseId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    caseId = `CASE${timestamp}${random}`;
    exists = await Case.exists({ caseId });
  } while (exists);

  return caseId;
}

async function generateCaseNumber(labId: Types.ObjectId): Promise<string> {
  const Case = model<ICase>('Case');
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  
  // Count cases for this lab today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const dailyCount = await Case.countDocuments({
    labId,
    'metadata.createdAt': { $gte: startOfDay, $lte: endOfDay }
  });
  
  const sequence = (dailyCount + 1).toString().padStart(4, '0');
  const labSuffix = labId.toString().slice(-4).toUpperCase();
  
  return `${year}${month}${labSuffix}${sequence}`;
}

// ====================== MODEL EXPORT ======================

export const Case: Model<ICase> = model<ICase>('Case', caseSchema);
export default Case;