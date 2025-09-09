import { Schema, model, Document, Types } from 'mongoose';
import { 
  Report, 
  ReportSummary, 
  ReportStatus, 
  ReportAuthorization, 
  ReportDelivery,
  ReportTestResult,
  TestResult
} from '../interfaces/Report.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface ReportMongoDoc 
  extends Document,
    Omit<Report, '_id' | 'caseId' | 'patientId' | 'organizationId' | 'authorization' | 'previousVersions'> {
  caseId: Types.ObjectId;
  patientId: Types.ObjectId;
  organizationId: Types.ObjectId;
  authorization: Omit<ReportAuthorization, 'authorizedBy'> & {
    authorizedBy?: Types.ObjectId;
  };
  previousVersions: Types.ObjectId[];
  
  // Document methods
  generateReportId(): Promise<string>;
  addCriticalValue(value: string): Promise<this>;
  removeCriticalValue(value: string): Promise<this>;
  authorize(userId: string, digitalSignature?: string): Promise<this>;
  release(deliveryMethod?: ReportDelivery['method']): Promise<this>;
  amend(reason: string, userId?: string): Promise<ReportMongoDoc>;
  markDelivered(deliveredTo: string): Promise<this>;
  markAccessed(): Promise<this>;
  incrementDownloadCount(): Promise<this>;
  canBeAmended(): boolean;
}

// Test Result Document interface
export interface ReportTestResultMongoDoc
  extends Document,
    Omit<ReportTestResult, '_id' | 'reportId' | 'testId' | 'sampleId' | 'performedBy' | 'verifiedBy'> {
  reportId: Types.ObjectId;
  testId: Types.ObjectId;
  sampleId?: Types.ObjectId;
  performedBy?: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  
  // Document methods
  addResult(result: TestResult): Promise<this>;
  updateResult(parameterId: string, value: string | number | boolean, flag?: TestResult['flag']): Promise<this>;
  flagCriticalValues(): Promise<this>;
  verify(userId: string): Promise<this>;
}

// Embedded Schemas
const ReportSummarySchema = new Schema<ReportSummary>({
  clinicalImpression: { type: String, maxlength: 1000 },
  recommendations: { type: String, maxlength: 1000 },
  criticalValues: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 critical values'
    }
  },
  followUpRequired: { type: Boolean, default: false }
}, { _id: false });

const ReportStatusSchema = new Schema<ReportStatus>({
  current: {
    type: String,
    enum: ['draft', 'pending', 'partialComplete', 'complete', 'verified', 'released', 'amended'],
    default: 'draft'
  },
  releasedAt: Date,
  amendedAt: Date,
  amendmentReason: { type: String, maxlength: 200 }
}, { _id: false });

const ReportAuthorizationSchema = new Schema<ReportAuthorization>({
  authorizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  authorizedAt: Date,
  digitalSignature: String
}, { _id: false });

const ReportDeliverySchema = new Schema<ReportDelivery>({
  method: {
    type: String,
    enum: ['email', 'portal', 'print', 'api'],
    default: 'portal'
  },
  deliveredAt: Date,
  deliveredTo: String,
  accessedAt: Date,
  downloadCount: { type: Number, default: 0, min: 0 }
}, { _id: false });

// Test Result Schemas
const TestResultSchema = new Schema<TestResult>({
  parameterId: { type: String, required: true },
  parameterName: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  unit: String,
  normalRange: String,
  flag: { 
    type: String, 
    enum: ['normal', 'low', 'high', 'critical', 'abnormal'] 
  },
  notes: { type: String, maxlength: 200 }
}, { _id: false });

// Main Report Schema
const ReportSchema = new Schema<ReportMongoDoc>({
  reportId: { 
    type: String, 
    match: /^RPT\d{8}$/,
    required: true
  },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  reportType: {
    type: String,
    enum: ['individual', 'panel', 'comprehensive'],
    required: true
  },
  testCount: { type: Number, default: 0, min: 0 },
  summary: { type: ReportSummarySchema, required: true },
  status: { type: ReportStatusSchema, required: true },
  authorization: { type: ReportAuthorizationSchema, required: true },
  delivery: { type: ReportDeliverySchema, required: true },
  
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
  version: { type: Number, default: 1, min: 1 },
  previousVersions: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Report'
  }]
});

// Report Test Result Schema (separate collection)
const ReportTestResultSchema = new Schema<ReportTestResultMongoDoc>({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  sampleId: { type: Schema.Types.ObjectId, ref: 'Sample' },
  testName: { type: String, required: true },
  results: [TestResultSchema],
  performedAt: Date,
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  interpretation: { type: String, maxlength: 1000 },
  
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

// Middleware
ReportSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    (this as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
});

ReportTestResultSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    (this as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
});

// Report Methods
ReportSchema.methods['generateReportId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('RPT', 'Report', 'reportId');
};

ReportSchema.methods['addCriticalValue'] = function(value: string) {
  if (!this['summary'].criticalValues.includes(value)) {
    this['summary'].criticalValues.push(value);
    this['summary'].followUpRequired = true;
  }
  return this['save']();
};

ReportSchema.methods['removeCriticalValue'] = function(value: string) {
  const index = this['summary'].criticalValues.indexOf(value);
  if (index > -1) {
    this['summary'].criticalValues.splice(index, 1);
    if (this['summary'].criticalValues.length === 0) {
      this['summary'].followUpRequired = false;
    }
  }
  return this['save']();
};

ReportSchema.methods['authorize'] = function(userId: string, digitalSignature?: string) {
  this['authorization'].authorizedBy = userId;
  this['authorization'].authorizedAt = new Date();
  if (digitalSignature) {
    this['authorization'].digitalSignature = digitalSignature;
  }
  this['status'].current = 'verified';
  
  return this['save']();
};

ReportSchema.methods['release'] = function(deliveryMethod?: ReportDelivery['method']) {
  if (this['status'].current !== 'verified') {
    throw new Error('Report must be verified before release');
  }
  
  this['status'].current = 'released';
  this['status'].releasedAt = new Date();
  if (deliveryMethod) {
    this['delivery'].method = deliveryMethod;
  }
  
  return this['save']();
};

ReportSchema.methods['amend'] = async function(reason: string): Promise<ReportMongoDoc> {
  if (!this['canBeAmended']()) {
    throw new Error('Report cannot be amended');
  }
  
  // Create new version
  const newVersion = new ReportModel({
    ...(this as unknown as { toObject: () => object }).toObject(),
    _id: undefined,
    reportId: undefined, // Will be auto-generated
    version: this['version'] + 1,
    previousVersions: [...this['previousVersions'], this['_id']],
    status: {
      current: 'draft',
      amendedAt: new Date(),
      amendmentReason: reason
    }
  });
  
  await newVersion.save();
  return newVersion;
};

ReportSchema.methods['markDelivered'] = function(deliveredTo: string) {
  this['delivery'].deliveredAt = new Date();
  this['delivery'].deliveredTo = deliveredTo;
  
  return this['save']();
};

ReportSchema.methods['markAccessed'] = function() {
  this['delivery'].accessedAt = new Date();
  
  return this['save']();
};

ReportSchema.methods['incrementDownloadCount'] = function() {
  this['delivery'].downloadCount += 1;
  
  return this['save']();
};

ReportSchema.methods['canBeAmended'] = function(): boolean {
  return this['status'].current === 'released' && this['version'] <= 10;
};

// Report Test Result Methods
ReportTestResultSchema.methods['addResult'] = function(result: TestResult) {
  this['results'].push(result);
  return this['save']();
};

ReportTestResultSchema.methods['updateResult'] = function(parameterId: string, value: string | number | boolean, flag?: TestResult['flag']) {
  const result = this['results'].find((r: TestResult) => r.parameterId === parameterId);
  if (result) {
    result.value = value;
    if (flag) {
      result.flag = flag;
    }
  }
  return this['save']();
};

ReportTestResultSchema.methods['flagCriticalValues'] = function() {
  this['results'].forEach((result: TestResult) => {
    // Logic to determine if values are critical based on normal ranges
    // This would typically be more complex and based on actual medical criteria
    if (result.flag === 'critical') {
      // Add to report's critical values if needed
    }
  });
  return this['save']();
};

ReportTestResultSchema.methods['verify'] = function(userId: string) {
  this['verifiedBy'] = userId;
  return this['save']();
};

// Pre-save middleware for reportId generation
ReportSchema.pre('save', async function() {
  if (this.isNew && !(this as unknown as { reportId: string }).reportId) {
    (this as unknown as { reportId: string }).reportId = await generateIdWithErrorHandling('RPT', 'Report', 'reportId');
  }
});

// Indexes for Report
ReportSchema.index({ reportId: 1 }, { unique: true });
ReportSchema.index({ caseId: 1 });
ReportSchema.index({ patientId: 1, 'status.current': 1 });
ReportSchema.index({ organizationId: 1, 'status.current': 1 });
ReportSchema.index({ 'status.releasedAt': -1 });
ReportSchema.index({ reportId: 'text' });

// Indexes for Report Test Results
ReportTestResultSchema.index({ reportId: 1 });
ReportTestResultSchema.index({ reportId: 1, testId: 1 }, { unique: true });
ReportTestResultSchema.index({ testId: 1 });
ReportTestResultSchema.index({ 'results.flag': 1 });

export const ReportModel = model<ReportMongoDoc>('Report', ReportSchema);
export const ReportTestResultModel = model<ReportTestResultMongoDoc>('ReportTestResult', ReportTestResultSchema);