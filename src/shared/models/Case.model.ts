import { Schema, model, Document, Types } from 'mongoose';
import { Case, CaseReferral, CaseWorkflowStage, CaseWorkflow, CaseTimeline } from '../interfaces/Case.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface CaseMongoDoc 
  extends Document,
    Omit<Case, '_id' | 'patientId' | 'organizationId' | 'referral'> {
  patientId: Types.ObjectId;
  organizationId: Types.ObjectId;
  referral: Omit<CaseReferral, 'referrerId'> & {
    referrerId?: Types.ObjectId;
  };
  
  // Document methods
  generateCaseId(): Promise<string>;
  updateWorkflowStage(stage: string, status: CaseWorkflowStage['status'], userId?: string): Promise<this>;
  checkSLABreach(): boolean;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const CaseReferralSchema = new Schema({
  type: {
    type: String,
    enum: ['doctor', 'hospital', 'selfReferral', 'corporate'],
    required: true
  },
  referrerId: { type: Schema.Types.ObjectId },
  referrerName: String,
  referralDate: { type: Date, default: Date.now }
}, { _id: false });

const CaseWorkflowStageSchema = new Schema<CaseWorkflowStage>({
  stage: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'inProgress', 'completed', 'skipped'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const CaseWorkflowSchema = new Schema<CaseWorkflow>({
  currentStage: {
    type: String,
    enum: ['registration', 'sampleCollection', 'processing', 'reporting', 'delivery'],
    default: 'registration'
  },
  stages: {
    type: [CaseWorkflowStageSchema],
    validate: {
      validator: function(v: CaseWorkflowStage[]) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 workflow stages'
    }
  }
}, { _id: false });

const CaseTimelineSchema = new Schema<CaseTimeline>({
  expectedCompletion: { type: Date, required: true },
  actualCompletion: Date,
  slaBreached: { type: Boolean, default: false }
}, { _id: false });

// Main Case Schema
const CaseSchema = new Schema<CaseMongoDoc>({
  caseId: { 
    type: String, 
    match: /^CASE\d{8}$/,
    required: true
  },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  referral: { type: CaseReferralSchema, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'sampleCollected', 'inProgress', 'completed', 'cancelled', 'onHold'],
    default: 'pending'
  },
  workflow: { type: CaseWorkflowSchema, required: true },
  timeline: { type: CaseTimelineSchema, required: true },
  notes: { type: String, maxlength: 2000 },
  attachmentCount: { type: Number, default: 0, min: 0 },
  
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
  deletedAt: {
    type: Date,
    sparse: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  }
});

// Middleware
CaseSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
CaseSchema.methods['generateCaseId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('CASE', 'Case', 'caseId');
};

CaseSchema.methods['updateWorkflowStage'] = function(stage: string, status: CaseWorkflowStage['status'], userId?: string) {
  const stageIndex = this['workflow'].stages.findIndex((s: CaseWorkflowStage) => s.stage === stage);
  
  if (stageIndex !== -1) {
    this['workflow'].stages[stageIndex].status = status;
    
    if (status === 'inProgress' && !this['workflow'].stages[stageIndex].startedAt) {
      this['workflow'].stages[stageIndex].startedAt = new Date();
    }
    
    if (status === 'completed') {
      this['workflow'].stages[stageIndex].completedAt = new Date();
      if (userId) {
        this['workflow'].stages[stageIndex].completedBy = userId;
      }
    }
  }
  
  this['workflow'].currentStage = stage as CaseWorkflow['currentStage'];
  return this['save']();
};

CaseSchema.methods['checkSLABreach'] = function(): boolean {
  const now = new Date();
  const expectedCompletion = this['timeline'].expectedCompletion;
  const isBreached = now > expectedCompletion && this['status'] !== 'completed';
  
  if (isBreached && !this['timeline'].slaBreached) {
    this['timeline'].slaBreached = true;
    this['save']();
  }
  
  return isBreached;
};

CaseSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['status'] = 'cancelled';
  return this['save']();
};

CaseSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['status'] = 'pending';
  return this['save']();
};

// Pre-save middleware for caseId generation
CaseSchema.pre('save', async function() {
  if (this.isNew && !this['caseId']) {
    this['caseId'] = await generateIdWithErrorHandling('CASE', 'Case', 'caseId');
  }
});

// Indexes
CaseSchema.index({ caseId: 1 }, { unique: true });
CaseSchema.index({ patientId: 1, status: 1 });
CaseSchema.index({ organizationId: 1, status: 1 });
CaseSchema.index({ 'referral.referrerId': 1 }, { sparse: true });
CaseSchema.index({ priority: 1, status: 1 });
CaseSchema.index({ 'timeline.expectedCompletion': 1 });
CaseSchema.index({ 'workflow.currentStage': 1, status: 1 });
CaseSchema.index({ caseId: 'text', notes: 'text' });

export const CaseModel = model<CaseMongoDoc>('Case', CaseSchema);