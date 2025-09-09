import { Schema, model, Document, Types } from 'mongoose';
import { 
  Test, 
  TestSampleRequirement,
  TestSampleRequirements, 
  TestParameter, 
  TestPricing, 
  TestTurnaround, 
  TestAvailability, 
  TestSampleType, 
  TestFastingRequirement, 
  TestMobileFields 
} from '../interfaces/Test.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface TestMongoDoc 
  extends Document,
    Omit<Test, '_id' | 'relatedTests'> {
  relatedTests?: Types.ObjectId[];
  
  // Document methods
  generateTestId(): Promise<string>;
  getFastingHours(): number;
  getFormattedPrice(): string;
  softDelete(): Promise<this>;
  restore(): Promise<this>;
}

// Embedded Schemas
const TestSampleRequirementSchema = new Schema<TestSampleRequirement>({
  type: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'saliva', 'tissue', 'swab'],
    required: true
  },
  volume: String,
  container: String,
  storageTemperature: String
}, { _id: false });

const TestSampleRequirementsSchema = new Schema<TestSampleRequirements>({
  types: [TestSampleRequirementSchema],
  fastingRequired: {
    type: String,
    enum: ['none', '8hours', '10hours', '12hours', 'overnight'],
    default: 'none'
  },
  specialInstructions: { type: String, maxlength: 500 }
}, { _id: false });

const TestParameterSchema = new Schema<TestParameter>({
  name: { type: String, required: true },
  displayName: String,
  unit: String,
  dataType: {
    type: String,
    enum: ['numeric', 'text', 'boolean', 'option'],
    required: true
  },
  normalRange: {
    min: Number,
    max: Number,
    text: String
  },
  criticalRange: {
    low: Number,
    high: Number
  },
  options: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 20;
      },
      message: 'Cannot have more than 20 options'
    }
  },
  order: { type: Number, required: true }
}, { _id: false });

const TestPricingSchema = new Schema<TestPricing>({
  basePrice: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  homeCollectionCharge: { type: Number, default: 0, min: 0 },
  urgentProcessingCharge: { type: Number, default: 0, min: 0 }
}, { _id: false });

const TestTurnaroundSchema = new Schema<TestTurnaround>({
  standard: { type: Number, required: true, min: 1 },
  urgent: { type: Number, min: 1 },
  unit: { type: String, enum: ['hours', 'days'], default: 'hours' }
}, { _id: false });

const TestAvailabilitySchema = new Schema<TestAvailability>({
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false }
}, { _id: false });

const TestSampleTypeSchema = new Schema<TestSampleType>({
  type: {
    type: String,
    enum: ['blood', 'urine', 'stool', 'saliva', 'tissue', 'swab'],
    required: true
  },
  displayName: String,
  icon: String
}, { _id: false });

const TestFastingRequirementSchema = new Schema<TestFastingRequirement>({
  required: {
    type: String,
    enum: ['none', '8_hours', '10_hours', '12_hours', 'overnight'],
    default: 'none'
  },
  displayText: String,
  instructions: { type: String, maxlength: 200 }
}, { _id: false });

const TestMobileFieldsSchema = new Schema<TestMobileFields>({
  icon: { type: String, required: true },
  duration: { type: String, required: true },
  reportTime: { type: String, required: true },
  keyMeasurements: {
    type: [String],
    default: [],
    validate: {
      validator: function(v: string[]) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 key measurements'
    }
  },
  healthBenefits: { type: String, maxlength: 200 },
  categoryColor: String,
  formattedPrice: String,
  formattedOriginalPrice: String
}, { _id: false });

// Main Test Schema
const TestSchema = new Schema<TestMongoDoc>({
  testId: { 
    type: String, 
    match: /^TST\d{8}$/,
    required: true
  },
  name: { type: String, required: true, trim: true },
  shortName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['bloodTest', 'imaging', 'cardiology', 'womensHealth', 'diabetes', 'thyroid', 'liver', 'kidney', 'cancer', 'fitness', 'allergy', 'infection', 'general'],
    required: true
  },
  subcategory: { type: String, trim: true },
  description: { type: String, required: true, maxlength: 500 },
  clinicalSignificance: { type: String, maxlength: 1000 },
  methodology: { type: String, required: true, trim: true },
  sampleRequirements: { type: TestSampleRequirementsSchema, required: true },
  parameters: [TestParameterSchema],
  pricing: { type: TestPricingSchema, required: true },
  turnaround: { type: TestTurnaroundSchema, required: true },
  availability: { type: TestAvailabilitySchema, required: true },
  searchTags: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 20;
      },
      message: 'Cannot have more than 20 search tags'
    }
  },
  relatedTests: [{
    type: Schema.Types.ObjectId,
    ref: 'Test',
    validate: {
      validator: function(v: Types.ObjectId[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 related tests'
    }
  }],
  sampleType: { type: TestSampleTypeSchema, required: true },
  fastingRequirement: { type: TestFastingRequirementSchema, required: true },
  mobileFields: { type: TestMobileFieldsSchema, required: true },
  sectionsCount: { type: Number, default: 0, min: 0 },
  
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
TestSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    (this as unknown as { updatedAt: Date }).updatedAt = new Date();
  }
});

// Methods
TestSchema.methods['generateTestId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('TST', 'Test', 'testId');
};

TestSchema.methods['getFastingHours'] = function(): number {
  const fastingReq = this['fastingRequirement'].required;
  switch (fastingReq) {
    case '8_hours': return 8;
    case '10_hours': return 10;
    case '12_hours': return 12;
    case 'overnight': return 10;
    default: return 0;
  }
};

TestSchema.methods['getFormattedPrice'] = function(): string {
  const price = this['pricing'].discountedPrice || this['pricing'].basePrice;
  return `₹${price.toFixed(2)}`;
};

TestSchema.methods['softDelete'] = function() {
  this['deletedAt'] = new Date();
  this['availability'].isActive = false;
  return this['save']();
};

TestSchema.methods['restore'] = function() {
  this['deletedAt'] = null;
  this['availability'].isActive = true;
  return this['save']();
};

// Pre-save middleware for testId generation
TestSchema.pre('save', async function() {
  if (this.isNew && !(this as unknown as { testId: string }).testId) {
    (this as unknown as { testId: string }).testId = await generateIdWithErrorHandling('TST', 'Test', 'testId');
  }
});

// Indexes
TestSchema.index({ testId: 1 }, { unique: true });
TestSchema.index({ category: 1, 'availability.isActive': 1 });
TestSchema.index({ 'availability.isFeatured': -1, 'availability.isPopular': -1 });
TestSchema.index({ 'pricing.basePrice': 1 });
TestSchema.index({ name: 'text', shortName: 'text', description: 'text', searchTags: 'text' });

export const TestModel = model<TestMongoDoc>('Test', TestSchema);