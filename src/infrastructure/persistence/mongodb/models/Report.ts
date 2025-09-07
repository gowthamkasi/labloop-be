/**
 * Report Model for LabLoop Healthcare System
 * Medical reports with comprehensive approval workflow and versioning
 * HIPAA-compliant with audit logging and digital signatures
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  IReport,
  ITestResult,
  IReportApproval,
  IReportDistribution,
  IReportVersioning,
  ReportStatus,
  ReportType,
  CriticalFlag
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const testResultSchema = new Schema<ITestResult>({
  testId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Test ID is required'],
    ref: 'tests',
  },
  sampleId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Sample ID is required'],
    ref: 'samples',
  },
  parameterName: {
    type: String,
    required: [true, 'Parameter name is required'],
    trim: true,
    maxlength: [100, 'Parameter name cannot exceed 100 characters'],
  },
  value: {
    type: Schema.Types.Mixed,
    validate: {
      validator: function(value: any) {
        return value !== undefined && value !== null;
      },
      message: 'Test result value is required',
    },
  },
  unit: {
    type: String,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
  },
  referenceRange: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference range cannot exceed 100 characters'],
  },
  flag: {
    type: String,
    enum: {
      values: ['low', 'high', 'critical', 'panic'] as CriticalFlag[],
      message: 'Invalid critical flag',
    },
  },
  abnormal: {
    type: Boolean,
    required: [true, 'Abnormal flag is required'],
    default: false,
  },
  comments: {
    type: String,
    maxlength: [500, 'Comments cannot exceed 500 characters'],
    trim: true,
  },
  methodology: {
    type: String,
    maxlength: [200, 'Methodology cannot exceed 200 characters'],
    trim: true,
  },
}, { _id: false });

const reportApprovalSchema = new Schema<IReportApproval>({
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  approvedAt: {
    type: Date,
  },
  approverName: {
    type: String,
    trim: true,
    maxlength: [100, 'Approver name cannot exceed 100 characters'],
  },
  approverDesignation: {
    type: String,
    trim: true,
    maxlength: [100, 'Approver designation cannot exceed 100 characters'],
  },
  digitalSignature: {
    type: String,
    trim: true,
  },
}, { _id: false });

const distributionEntrySchema = new Schema({
  recipient: {
    type: String,
    required: [true, 'Recipient type is required'],
    enum: ['patient', 'physician', 'hospital'],
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Recipient ID is required'],
    refPath: 'distribution.recipient',
  },
  method: {
    type: String,
    required: [true, 'Distribution method is required'],
    enum: ['email', 'sms', 'print', 'portal'],
  },
  sentAt: {
    type: Date,
    required: [true, 'Sent timestamp is required'],
    default: Date.now,
  },
  status: {
    type: String,
    required: [true, 'Distribution status is required'],
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
  },
}, { _id: false });

const reportDistributionSchema = new Schema<IReportDistribution>({
  sentTo: {
    type: [distributionEntrySchema],
    validate: {
      validator: (entries: any[]) => entries.length <= 10,
      message: 'Cannot have more than 10 distribution entries',
    },
  },
}, { _id: false });

const amendmentSchema = new Schema({
  amendmentReason: {
    type: String,
    required: [true, 'Amendment reason is required'],
    trim: true,
    maxlength: [500, 'Amendment reason cannot exceed 500 characters'],
  },
  amendedBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Amended by user is required'],
    ref: 'users',
  },
  amendedAt: {
    type: Date,
    required: [true, 'Amendment timestamp is required'],
    default: Date.now,
  },
  changesDescription: {
    type: String,
    required: [true, 'Changes description is required'],
    trim: true,
    maxlength: [1000, 'Changes description cannot exceed 1000 characters'],
  },
}, { _id: false });

const reportVersioningSchema = new Schema<IReportVersioning>({
  version: {
    type: String,
    required: [true, 'Version is required'],
    default: '1.0',
  },
  isLatest: {
    type: Boolean,
    required: [true, 'Latest flag is required'],
    default: true,
  },
  previousVersions: {
    type: [Schema.Types.ObjectId],
    ref: 'reports',
    validate: {
      validator: (versions: Types.ObjectId[]) => versions.length <= 10,
      message: 'Cannot have more than 10 previous versions',
    },
  },
  amendments: {
    type: [amendmentSchema],
    validate: {
      validator: (amendments: any[]) => amendments.length <= 20,
      message: 'Cannot have more than 20 amendments',
    },
  },
}, { _id: false });

// ====================== MAIN REPORT SCHEMA ======================

const reportSchema = new Schema<IReport>({
  reportId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (reportId: string) => /^RPT[0-9]{8}$/.test(reportId),
      message: 'Report ID must follow pattern RPT followed by 8 digits',
    },
  },
  reportNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Report number cannot exceed 50 characters'],
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
  labId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Lab ID is required'],
    ref: 'labs',
  },
  reportType: {
    type: String,
    required: [true, 'Report type is required'],
    enum: {
      values: ['preliminary', 'final', 'amended', 'supplementary'] as ReportType[],
      message: 'Invalid report type',
    },
    default: 'final',
  },
  status: {
    type: String,
    required: [true, 'Report status is required'],
    enum: {
      values: ['draft', 'inReview', 'approved', 'published', 'cancelled', 'amended'] as ReportStatus[],
      message: 'Invalid report status',
    },
    default: 'draft',
  },
  testResults: {
    type: [testResultSchema],
    required: [true, 'Test results are required'],
    validate: {
      validator: (results: ITestResult[]) => results.length > 0 && results.length <= 200,
      message: 'Must have 1-200 test results',
    },
  },
  overallInterpretation: {
    type: String,
    maxlength: [2000, 'Overall interpretation cannot exceed 2000 characters'],
    trim: true,
  },
  clinicalCorrelation: {
    type: String,
    maxlength: [1000, 'Clinical correlation cannot exceed 1000 characters'],
    trim: true,
  },
  recommendations: {
    type: [String],
    validate: {
      validator: (recommendations: string[]) => recommendations.length <= 10,
      message: 'Cannot have more than 10 recommendations',
    },
  },
  criticalValues: {
    type: [testResultSchema],
    validate: {
      validator: (values: ITestResult[]) => values.length <= 50,
      message: 'Cannot have more than 50 critical values',
    },
  },
  technicalComments: {
    type: String,
    maxlength: [1000, 'Technical comments cannot exceed 1000 characters'],
    trim: true,
  },
  generatedAt: {
    type: Date,
    required: [true, 'Generation timestamp is required'],
    default: Date.now,
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Generator user is required'],
    ref: 'users',
  },
  approval: {
    type: reportApprovalSchema,
    required: [true, 'Approval information is required'],
  },
  versioning: {
    type: reportVersioningSchema,
    required: [true, 'Versioning information is required'],
  },
  distribution: reportDistributionSchema,
  pdfPath: {
    type: String,
    trim: true,
  },
  isConfidential: {
    type: Boolean,
    default: false,
  },
  customFields: {
    type: Schema.Types.Mixed,
  },
  qualityFlags: {
    type: [String],
    validate: {
      validator: (flags: string[]) => flags.length <= 10,
      message: 'Cannot have more than 10 quality flags',
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
  timestamps: false,
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

reportSchema.index({ reportId: 1 }, { unique: true });
reportSchema.index({ reportNumber: 1 }, { unique: true, sparse: true });
reportSchema.index({ caseId: 1 });
reportSchema.index({ patientId: 1, generatedAt: -1 });
reportSchema.index({ labId: 1, status: 1 });
reportSchema.index({ status: 1, reportType: 1 });
reportSchema.index({ generatedAt: -1 });
reportSchema.index({ 'approval.approvedAt': -1 }, { sparse: true });
reportSchema.index({ 'versioning.isLatest': 1 });
reportSchema.index({ isConfidential: 1 });
reportSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });

// ====================== VIRTUAL PROPERTIES ======================

reportSchema.virtual('isApproved').get(function () {
  return this.status === 'approved' || this.status === 'published';
});

reportSchema.virtual('hasCriticalValues').get(function () {
  return this.criticalValues && this.criticalValues.length > 0;
});

reportSchema.virtual('abnormalResultsCount').get(function () {
  return this.testResults.filter(result => result.abnormal).length;
});

// ====================== MIDDLEWARE ======================

reportSchema.pre('save', async function (next) {
  if (this.isNew && !this.reportId) {
    this.reportId = await generateReportId();
  }

  if (this.isNew && !this.reportNumber) {
    this.reportNumber = await generateReportNumber(this.labId);
  }

  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Extract critical values
  this.criticalValues = this.testResults.filter(result => 
    result.flag && ['critical', 'panic'].includes(result.flag)
  );

  next();
});

reportSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

reportSchema.methods.approve = function (approvedBy: Types.ObjectId, approverName: string, designation?: string) {
  this.status = 'approved';
  this.approval = {
    approvedBy,
    approvedAt: new Date(),
    approverName,
    approverDesignation: designation,
  };
  return this.save();
};

reportSchema.methods.publish = function () {
  if (this.status !== 'approved') {
    throw new Error('Report must be approved before publishing');
  }
  this.status = 'published';
  return this.save();
};

reportSchema.methods.amend = function (reason: string, changesDescription: string, amendedBy: Types.ObjectId) {
  // Create new version
  const newVersion = parseFloat(this.versioning.version) + 0.1;
  
  this.versioning.amendments.push({
    amendmentReason: reason,
    amendedBy,
    amendedAt: new Date(),
    changesDescription,
  } as any);
  
  this.versioning.version = newVersion.toFixed(1);
  this.reportType = 'amended';
  this.status = 'draft';
  
  return this.save();
};

// ====================== STATIC METHODS ======================

reportSchema.statics.findByReportId = function (reportId: string) {
  return this.findOne({ reportId });
};

reportSchema.statics.findByCase = function (caseId: Types.ObjectId) {
  return this.find({ caseId });
};

reportSchema.statics.findByPatient = function (patientId: Types.ObjectId) {
  return this.find({ patientId });
};

// ====================== HELPER FUNCTIONS ======================

async function generateReportId(): Promise<string> {
  const Report = model<IReport>('Report');
  let reportId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    reportId = `RPT${timestamp.slice(-4)}${random}`;
    exists = await Report.exists({ reportId });
  } while (exists);

  return reportId;
}

async function generateReportNumber(labId: Types.ObjectId): Promise<string> {
  const Report = model<IReport>('Report');
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  
  const dailyCount = await Report.countDocuments({
    labId,
    generatedAt: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999))
    }
  });
  
  const sequence = (dailyCount + 1).toString().padStart(4, '0');
  const labSuffix = labId.toString().slice(-4).toUpperCase();
  
  return `R${year}${month}${labSuffix}${sequence}`;
}

export const Report: Model<IReport> = model<IReport>('Report', reportSchema);
export default Report;