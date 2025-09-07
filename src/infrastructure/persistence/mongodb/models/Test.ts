/**
 * Test Model for LabLoop Healthcare System
 * Comprehensive test catalog with parameters, pricing, and requirements
 * Optimized for healthcare test management with clinical validation
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  ITest,
  ITestParameter,
  ITestPricing,
  ITestRequirements,
  ITestTimings,
  TestCategory,
  TestStatus,
  SampleType,
  TestComplexity
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const testParameterSchema = new Schema<ITestParameter>({
  parameterName: {
    type: String,
    required: [true, 'Parameter name is required'],
    trim: true,
    maxlength: [100, 'Parameter name cannot exceed 100 characters'],
  },
  unit: {
    type: String,
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters'],
  },
  referenceRange: {
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    qualitative: {
      type: [String],
      validate: {
        validator: (values: string[]) => values.length <= 10,
        message: 'Cannot have more than 10 qualitative values',
      },
    },
  },
  criticalRange: {
    low: {
      type: Number,
    },
    high: {
      type: Number,
    },
  },
}, { _id: false });

const testPricingSchema = new Schema<ITestPricing>({
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative'],
  },
  homeCollectionPrice: {
    type: Number,
    min: [0, 'Home collection price cannot be negative'],
  },
  urgentPrice: {
    type: Number,
    min: [0, 'Urgent price cannot be negative'],
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    validate: {
      validator: function(this: ITestPricing, discountedPrice: number) {
        return !discountedPrice || discountedPrice <= this.basePrice;
      },
      message: 'Discounted price cannot exceed base price',
    },
  },
  insuranceCovered: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const testRequirementsSchema = new Schema<ITestRequirements>({
  fastingRequired: {
    type: Boolean,
    default: false,
  },
  fastingHours: {
    type: Number,
    min: [0, 'Fasting hours cannot be negative'],
    max: [24, 'Fasting hours cannot exceed 24'],
    validate: {
      validator: function(this: ITestRequirements, hours: number) {
        return !hours || this.fastingRequired;
      },
      message: 'Fasting hours can only be set when fasting is required',
    },
  },
  specialInstructions: {
    type: [String],
    validate: {
      validator: (instructions: string[]) => instructions.length <= 10,
      message: 'Cannot have more than 10 special instructions',
    },
  },
  sampleVolume: {
    type: String,
    trim: true,
    maxlength: [50, 'Sample volume description cannot exceed 50 characters'],
  },
  sampleContainer: {
    type: String,
    trim: true,
    maxlength: [50, 'Sample container description cannot exceed 50 characters'],
  },
  storageConditions: {
    type: String,
    trim: true,
    maxlength: [100, 'Storage conditions cannot exceed 100 characters'],
  },
}, { _id: false });

const testTimingsSchema = new Schema<ITestTimings>({
  normalReportTime: {
    type: Number,
    required: [true, 'Normal report time is required'],
    min: [1, 'Report time must be at least 1 hour'],
    max: [168, 'Report time cannot exceed 7 days (168 hours)'],
  },
  urgentReportTime: {
    type: Number,
    min: [1, 'Urgent report time must be at least 1 hour'],
    max: [48, 'Urgent report time cannot exceed 48 hours'],
    validate: {
      validator: function(this: ITestTimings, urgentTime: number) {
        return !urgentTime || urgentTime < this.normalReportTime;
      },
      message: 'Urgent report time must be less than normal report time',
    },
  },
  processingDays: {
    type: [String],
    enum: {
      values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      message: 'Processing days must be valid day names',
    },
    validate: {
      validator: (days: string[]) => days.length <= 7,
      message: 'Cannot have more than 7 processing days',
    },
  },
  processingHours: {
    start: {
      type: String,
      validate: {
        validator: (time: string) => !time || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
        message: 'Processing start time must be in HH:MM format',
      },
    },
    end: {
      type: String,
      validate: {
        validator: (time: string) => !time || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time),
        message: 'Processing end time must be in HH:MM format',
      },
    },
  },
}, { _id: false });

// ====================== MAIN TEST SCHEMA ======================

const testSchema = new Schema<ITest>({
  testId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (testId: string) => /^TST[0-9]{6}$/.test(testId),
      message: 'Test ID must follow pattern TST followed by 6 digits',
    },
  },
  testCode: {
    type: String,
    required: [true, 'Test code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Test code cannot exceed 20 characters'],
    validate: {
      validator: (code: string) => /^[A-Z0-9_]+$/.test(code),
      message: 'Test code can only contain uppercase letters, numbers, and underscores',
    },
  },
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    minlength: [2, 'Test name must be at least 2 characters'],
    maxlength: [200, 'Test name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: [50, 'Short name cannot exceed 50 characters'],
  },
  category: {
    type: String,
    required: [true, 'Test category is required'],
    enum: {
      values: ['biochemistry', 'hematology', 'microbiology', 'immunology', 'genetics', 'pathology', 'radiology'] as TestCategory[],
      message: 'Invalid test category',
    },
  },
  subCategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Sub-category cannot exceed 100 characters'],
  },
  complexity: {
    type: String,
    required: [true, 'Test complexity is required'],
    enum: {
      values: ['basic', 'intermediate', 'advanced', 'specialized'] as TestComplexity[],
      message: 'Invalid test complexity level',
    },
  },
  sampleType: {
    type: [String],
    required: [true, 'At least one sample type is required'],
    enum: {
      values: ['blood', 'urine', 'stool', 'sputum', 'tissue', 'csf', 'other'] as SampleType[],
      message: 'Invalid sample type',
    },
    validate: {
      validator: (types: string[]) => types.length > 0 && types.length <= 5,
      message: 'Must have 1-5 sample types',
    },
  },
  parameters: {
    type: [testParameterSchema],
    required: [true, 'Test parameters are required'],
    validate: {
      validator: (parameters: ITestParameter[]) => parameters.length > 0 && parameters.length <= 50,
      message: 'Must have 1-50 test parameters',
    },
  },
  methodology: {
    type: String,
    trim: true,
    maxlength: [200, 'Methodology cannot exceed 200 characters'],
  },
  department: {
    type: String,
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters'],
  },
  pricing: {
    type: testPricingSchema,
    required: [true, 'Test pricing is required'],
  },
  requirements: {
    type: testRequirementsSchema,
    required: [true, 'Test requirements are required'],
  },
  timings: {
    type: testTimingsSchema,
    required: [true, 'Test timings are required'],
  },
  relatedTests: {
    type: [Schema.Types.ObjectId],
    ref: 'tests',
    validate: {
      validator: (tests: Types.ObjectId[]) => tests.length <= 10,
      message: 'Cannot have more than 10 related tests',
    },
  },
  tags: {
    type: [String],
    validate: {
      validator: (tags: string[]) => tags.length <= 20,
      message: 'Cannot have more than 20 tags',
    },
  },
  keywords: {
    type: [String],
    validate: {
      validator: (keywords: string[]) => keywords.length <= 30,
      message: 'Cannot have more than 30 keywords',
    },
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isRoutine: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'discontinued', 'comingSoon', 'seasonal'] as TestStatus[],
      message: 'Invalid test status',
    },
    default: 'active',
  },
  minimumAge: {
    type: Number,
    min: [0, 'Minimum age cannot be negative'],
    max: [120, 'Minimum age cannot exceed 120 years'],
  },
  maximumAge: {
    type: Number,
    min: [0, 'Maximum age cannot be negative'],
    max: [120, 'Maximum age cannot exceed 120 years'],
    validate: {
      validator: function(this: ITest, maxAge: number) {
        return !maxAge || !this.minimumAge || maxAge >= this.minimumAge;
      },
      message: 'Maximum age must be greater than or equal to minimum age',
    },
  },
  genderSpecific: {
    type: String,
    enum: {
      values: ['male', 'female', 'both'],
      message: 'Gender specific must be male, female, or both',
    },
    default: 'both',
  },
  clinicalSignificance: {
    type: String,
    trim: true,
    maxlength: [1000, 'Clinical significance cannot exceed 1000 characters'],
  },
  limitations: {
    type: [String],
    validate: {
      validator: (limitations: string[]) => limitations.length <= 10,
      message: 'Cannot have more than 10 limitations',
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
      // Remove sensitive information from JSON output
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
testSchema.index({ testId: 1 }, { unique: true });
testSchema.index({ testCode: 1 }, { unique: true });

// Basic operational indexes
testSchema.index({ category: 1, status: 1 });
testSchema.index({ status: 1, isPopular: -1 });
testSchema.index({ status: 1, isRoutine: 1 });
testSchema.index({ complexity: 1, status: 1 });

// Sample type and requirements indexes
testSchema.index({ sampleType: 1 });
testSchema.index({ 'requirements.fastingRequired': 1 });
testSchema.index({ department: 1, status: 1 });

// Pricing indexes
testSchema.index({ 'pricing.basePrice': 1 });
testSchema.index({ 'pricing.insuranceCovered': 1 });

// Timing indexes
testSchema.index({ 'timings.normalReportTime': 1 });
testSchema.index({ 'timings.urgentReportTime': 1 });

// Age and gender indexes
testSchema.index({ minimumAge: 1, maximumAge: 1 });
testSchema.index({ genderSpecific: 1, status: 1 });

// Text search index
testSchema.index({
  name: 'text',
  shortName: 'text',
  description: 'text',
  testCode: 'text',
  tags: 'text',
  keywords: 'text',
  'parameters.parameterName': 'text'
});

// Compound indexes for common queries
testSchema.index({ 
  category: 1, 
  'pricing.basePrice': 1, 
  status: 1 
});
testSchema.index({ 
  isPopular: -1, 
  isRoutine: -1, 
  status: 1 
});
testSchema.index({ 
  sampleType: 1, 
  'requirements.fastingRequired': 1, 
  status: 1 
});

// Related tests index
testSchema.index({ relatedTests: 1 }, { sparse: true });

// Metadata indexes
testSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });
testSchema.index({ 'metadata.createdAt': -1 });

// ====================== VIRTUAL PROPERTIES ======================

testSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

testSchema.virtual('requiresFasting').get(function () {
  return this.requirements.fastingRequired;
});

testSchema.virtual('hasUrgentOption').get(function () {
  return !!(this.timings.urgentReportTime && this.pricing.urgentPrice);
});

testSchema.virtual('effectivePrice').get(function () {
  return this.pricing.discountedPrice || this.pricing.basePrice;
});

testSchema.virtual('parameterCount').get(function () {
  return this.parameters?.length || 0;
});

testSchema.virtual('primarySampleType').get(function () {
  return this.sampleType?.[0] || 'unknown';
});

testSchema.virtual('ageRange').get(function () {
  if (!this.minimumAge && !this.maximumAge) return 'All ages';
  if (this.minimumAge && !this.maximumAge) return `${this.minimumAge}+ years`;
  if (!this.minimumAge && this.maximumAge) return `Up to ${this.maximumAge} years`;
  return `${this.minimumAge}-${this.maximumAge} years`;
});

testSchema.virtual('reportTimeRange').get(function () {
  const normal = this.timings.normalReportTime;
  const urgent = this.timings.urgentReportTime;
  
  if (urgent && urgent < normal) {
    return `${urgent}-${normal} hours`;
  }
  return `${normal} hours`;
});

// ====================== MIDDLEWARE ======================

// Pre-save middleware
testSchema.pre('save', async function (next) {
  // Auto-generate testId if not provided
  if (this.isNew && !this.testId) {
    this.testId = await generateTestId();
  }

  // Auto-generate testCode if not provided
  if (this.isNew && !this.testCode) {
    this.testCode = generateTestCode(this.name, this.category);
  }

  // Update metadata
  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Auto-populate short name if not provided
  if (!this.shortName && this.name) {
    this.shortName = this.name.length > 50 
      ? this.name.substring(0, 47) + '...'
      : this.name;
  }

  // Auto-generate keywords from name and description
  if (this.isModified('name') || this.isModified('description')) {
    this.keywords = generateKeywords(this.name, this.description, this.category);
  }

  // Validate parameter uniqueness
  if (this.parameters && this.parameters.length > 0) {
    const paramNames = this.parameters.map(p => p.parameterName.toLowerCase());
    const uniqueNames = new Set(paramNames);
    if (paramNames.length !== uniqueNames.size) {
      throw new Error('Parameter names must be unique within a test');
    }
  }

  next();
});

// Pre-validate middleware
testSchema.pre('validate', function (next) {
  // Normalize test code to uppercase
  if (this.testCode) {
    this.testCode = this.testCode.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  }

  // Validate pricing logic
  if (this.pricing && this.pricing.discountedPrice && this.pricing.discountedPrice > this.pricing.basePrice) {
    this.invalidate('pricing.discountedPrice', 'Discounted price cannot exceed base price');
  }

  // Validate age range
  if (this.minimumAge && this.maximumAge && this.minimumAge > this.maximumAge) {
    this.invalidate('maximumAge', 'Maximum age must be greater than or equal to minimum age');
  }

  // Validate fasting requirements
  if (this.requirements.fastingHours && !this.requirements.fastingRequired) {
    this.invalidate('requirements.fastingHours', 'Fasting hours can only be set when fasting is required');
  }

  next();
});

// Post-save middleware for logging
testSchema.post('save', function (doc, next) {
  console.log(`Test ${doc.name} (${doc.testId}) has been saved`);
  next();
});

// Query middleware to exclude soft-deleted documents by default
testSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

testSchema.methods.addParameter = function (parameter: ITestParameter) {
  if (!this.parameters) {
    this.parameters = [];
  }
  
  // Check for duplicate parameter names
  const exists = this.parameters.some(p => p.parameterName === parameter.parameterName);
  if (exists) {
    throw new Error(`Parameter "${parameter.parameterName}" already exists`);
  }
  
  if (this.parameters.length < 50) {
    this.parameters.push(parameter);
    return this.save();
  }
  
  throw new Error('Cannot add more than 50 parameters to a test');
};

testSchema.methods.updateParameter = function (parameterName: string, updates: Partial<ITestParameter>) {
  if (this.parameters) {
    const paramIndex = this.parameters.findIndex(p => p.parameterName === parameterName);
    if (paramIndex !== -1) {
      this.parameters[paramIndex] = { ...this.parameters[paramIndex], ...updates };
      return this.save();
    }
  }
  throw new Error(`Parameter "${parameterName}" not found`);
};

testSchema.methods.removeParameter = function (parameterName: string) {
  if (this.parameters) {
    this.parameters = this.parameters.filter(p => p.parameterName !== parameterName);
    return this.save();
  }
  return Promise.resolve(this);
};

testSchema.methods.updatePricing = function (pricing: Partial<ITestPricing>) {
  // Validate pricing before updating
  if (pricing.discountedPrice && pricing.discountedPrice > (pricing.basePrice || this.pricing.basePrice)) {
    throw new Error('Discounted price cannot exceed base price');
  }
  
  this.pricing = { ...this.pricing, ...pricing };
  return this.save();
};

testSchema.methods.addRelatedTest = function (testId: Types.ObjectId) {
  if (!this.relatedTests) {
    this.relatedTests = [];
  }
  
  if (!this.relatedTests.includes(testId) && this.relatedTests.length < 10) {
    this.relatedTests.push(testId);
    return this.save();
  }
  
  return Promise.resolve(this);
};

testSchema.methods.removeRelatedTest = function (testId: Types.ObjectId) {
  if (this.relatedTests) {
    this.relatedTests = this.relatedTests.filter(id => !id.equals(testId));
    return this.save();
  }
  return Promise.resolve(this);
};

testSchema.methods.markAsPopular = function () {
  this.isPopular = true;
  return this.save();
};

testSchema.methods.updateStatus = function (status: TestStatus) {
  this.status = status;
  return this.save();
};

testSchema.methods.softDelete = function (deletedBy?: Types.ObjectId) {
  return this.updateOne({
    'metadata.deletedAt': new Date(),
    'metadata.updatedAt': new Date(),
    ...(deletedBy && { 'metadata.updatedBy': deletedBy }),
  });
};

// ====================== STATIC METHODS ======================

testSchema.statics.findByTestId = function (testId: string) {
  return this.findOne({ testId });
};

testSchema.statics.findByTestCode = function (testCode: string) {
  return this.findOne({ testCode: testCode.toUpperCase() });
};

testSchema.statics.findActiveTests = function (filter: any = {}) {
  return this.find({ ...filter, status: 'active' });
};

testSchema.statics.findByCategory = function (category: TestCategory) {
  return this.find({ category, status: 'active' });
};

testSchema.statics.findPopularTests = function (limit: number = 10) {
  return this.find({ 
    isPopular: true, 
    status: 'active' 
  }).limit(limit);
};

testSchema.statics.findRoutineTests = function () {
  return this.find({ 
    isRoutine: true, 
    status: 'active' 
  });
};

testSchema.statics.findBySampleType = function (sampleType: SampleType) {
  return this.find({ 
    sampleType: sampleType, 
    status: 'active' 
  });
};

testSchema.statics.findByPriceRange = function (minPrice: number, maxPrice: number) {
  return this.find({
    'pricing.basePrice': { $gte: minPrice, $lte: maxPrice },
    status: 'active'
  });
};

testSchema.statics.findFastingTests = function () {
  return this.find({
    'requirements.fastingRequired': true,
    status: 'active'
  });
};

testSchema.statics.findByComplexity = function (complexity: TestComplexity) {
  return this.find({ complexity, status: 'active' });
};

testSchema.statics.findByAgeGroup = function (age: number) {
  return this.find({
    $and: [
      { $or: [{ minimumAge: { $exists: false } }, { minimumAge: { $lte: age } }] },
      { $or: [{ maximumAge: { $exists: false } }, { maximumAge: { $gte: age } }] }
    ],
    status: 'active'
  });
};

// ====================== HELPER FUNCTIONS ======================

async function generateTestId(): Promise<string> {
  const Test = model<ITest>('Test');
  let testId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    testId = `TST${timestamp}${random}`;
    exists = await Test.exists({ testId });
  } while (exists);

  return testId;
}

function generateTestCode(name: string, category: string): string {
  // Create test code from name and category
  const nameAbbr = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 6)
    .toUpperCase();
    
  const categoryAbbr = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);
  
  return `${categoryAbbr}_${nameAbbr}_${timestamp}`;
}

function generateKeywords(name?: string, description?: string, category?: string): string[] {
  const keywords = new Set<string>();
  
  // Extract keywords from name
  if (name) {
    name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .forEach(word => keywords.add(word));
  }
  
  // Extract keywords from description
  if (description) {
    description.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10) // Limit to first 10 words
      .forEach(word => keywords.add(word));
  }
  
  // Add category as keyword
  if (category) {
    keywords.add(category.toLowerCase());
  }
  
  return Array.from(keywords).slice(0, 30); // Limit to 30 keywords
}

// ====================== MODEL EXPORT ======================

export const Test: Model<ITest> = model<ITest>('Test', testSchema);
export default Test;