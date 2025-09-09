import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface TestContentCategory {
  icon?: string;
  title?: string;
  items?: string[];
  color?: string;
}

export interface TestFAQ {
  question?: string;
  answer?: string;
}

export interface TestSectionContent {
  overview?: string;
  bulletPoints?: string[];
  categories?: TestContentCategory[];
  tips?: string[];
  warnings?: string[];
  faqs?: TestFAQ[];
  references?: string[];
}

export interface TestSection {
  _id: Types.ObjectId;
  testId: Types.ObjectId;
  type: 'about' | 'whyNeeded' | 'insights' | 'preparation' | 'results';
  title: string;
  content: TestSectionContent;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface TestSectionMongoDoc 
  extends Document, 
    Omit<TestSection, '_id'> {
  
  // Document methods
  updateContent(content: Partial<TestSectionContent>): Promise<this>;
  addBulletPoint(point: string): Promise<this>;
  removeBulletPoint(point: string): Promise<this>;
  addTip(tip: string): Promise<this>;
  removeTip(tip: string): Promise<this>;
  addWarning(warning: string): Promise<this>;
  removeWarning(warning: string): Promise<this>;
  addFAQ(faq: TestFAQ): Promise<this>;
  removeFAQ(question: string): Promise<this>;
  addReference(reference: string): Promise<this>;
  removeReference(reference: string): Promise<this>;
  activate(): Promise<this>;
  deactivate(): Promise<this>;
  updateOrder(order: number): Promise<this>;
}

// Embedded Schemas
const TestContentCategorySchema = new Schema<TestContentCategory>({
  icon: String,
  title: String,
  items: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 items per category'
    }
  },
  color: String
}, { _id: false });

const TestFAQSchema = new Schema<TestFAQ>({
  question: String,
  answer: String
}, { _id: false });

const TestSectionContentSchema = new Schema<TestSectionContent>({
  overview: { type: String, maxlength: 2000 },
  bulletPoints: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 20;
      },
      message: 'Cannot have more than 20 bullet points'
    }
  },
  categories: [TestContentCategorySchema],
  tips: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 tips'
    }
  },
  warnings: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 10;
      },
      message: 'Cannot have more than 10 warnings'
    }
  },
  faqs: [TestFAQSchema],
  references: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 5;
      },
      message: 'Cannot have more than 5 references'
    }
  }
}, { _id: false });

// Main Schema
const TestSectionSchema = new Schema<TestSectionMongoDoc>({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  type: {
    type: String,
    enum: ['about', 'whyNeeded', 'insights', 'preparation', 'results'],
    required: true
  },
  title: { type: String, required: true, trim: true },
  content: { type: TestSectionContentSchema, required: true },
  order: { type: Number, default: 0 },
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
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
TestSectionSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
TestSectionSchema.methods['updateContent'] = function(content: Partial<TestSectionContent>) {
  Object.assign(this['content'], content);
  return this['save']();
};

TestSectionSchema.methods['addBulletPoint'] = function(point: string) {
  if (!this['content'].bulletPoints) {
    this['content'].bulletPoints = [];
  }
  
  if (!this['content'].bulletPoints.includes(point)) {
    this['content'].bulletPoints.push(point);
  }
  
  return this['save']();
};

TestSectionSchema.methods['removeBulletPoint'] = function(point: string) {
  if (this['content'].bulletPoints) {
    this['content'].bulletPoints = this['content'].bulletPoints.filter((bp: string) => bp !== point);
  }
  return this['save']();
};

TestSectionSchema.methods['addTip'] = function(tip: string) {
  if (!this['content'].tips) {
    this['content'].tips = [];
  }
  
  if (!this['content'].tips.includes(tip)) {
    this['content'].tips.push(tip);
  }
  
  return this['save']();
};

TestSectionSchema.methods['removeTip'] = function(tip: string) {
  if (this['content'].tips) {
    this['content'].tips = this['content'].tips.filter((t: string) => t !== tip);
  }
  return this['save']();
};

TestSectionSchema.methods['addWarning'] = function(warning: string) {
  if (!this['content'].warnings) {
    this['content'].warnings = [];
  }
  
  if (!this['content'].warnings.includes(warning)) {
    this['content'].warnings.push(warning);
  }
  
  return this['save']();
};

TestSectionSchema.methods['removeWarning'] = function(warning: string) {
  if (this['content'].warnings) {
    this['content'].warnings = this['content'].warnings.filter((w: string) => w !== warning);
  }
  return this['save']();
};

TestSectionSchema.methods['addFAQ'] = function(faq: TestFAQ) {
  if (!this['content'].faqs) {
    this['content'].faqs = [];
  }
  
  this['content'].faqs.push(faq);
  return this['save']();
};

TestSectionSchema.methods['removeFAQ'] = function(question: string) {
  if (this['content'].faqs) {
    this['content'].faqs = this['content'].faqs.filter((faq: TestFAQ) => faq.question !== question);
  }
  return this['save']();
};

TestSectionSchema.methods['addReference'] = function(reference: string) {
  if (!this['content'].references) {
    this['content'].references = [];
  }
  
  if (!this['content'].references.includes(reference)) {
    this['content'].references.push(reference);
  }
  
  return this['save']();
};

TestSectionSchema.methods['removeReference'] = function(reference: string) {
  if (this['content'].references) {
    this['content'].references = this['content'].references.filter((ref: string) => ref !== reference);
  }
  return this['save']();
};

TestSectionSchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

TestSectionSchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

TestSectionSchema.methods['updateOrder'] = function(order: number) {
  this['order'] = order;
  return this['save']();
};

// Indexes
TestSectionSchema.index({ testId: 1, type: 1 }, { unique: true });
TestSectionSchema.index({ testId: 1, order: 1 });
TestSectionSchema.index({ type: 1, isActive: 1 });

export const TestSectionModel = model<TestSectionMongoDoc>('TestSection', TestSectionSchema);