import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface OfferConditions {
  minAmount?: number;
  applicableTests?: Types.ObjectId[];
  applicableCategories?: string[];
  dayOfWeek?: number[];
  timeSlots?: string[];
}

export interface OfferValidity {
  startDate: Date;
  endDate: Date;
}

export interface OfferUsageLimit {
  total?: number;
  perUser?: number;
  used: number;
}

export interface SlotSpecialOffer {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  offerType: 'percentage' | 'fixed' | 'bundle' | 'freeAddon';
  discount?: number;
  conditions: OfferConditions;
  validity: OfferValidity;
  usageLimit: OfferUsageLimit;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface SlotSpecialOfferMongoDoc 
  extends Document, 
    Omit<SlotSpecialOffer, '_id'> {
  
  // Document methods
  updateOffer(updates: Partial<SlotSpecialOffer>): Promise<this>;
  updateConditions(conditions: Partial<OfferConditions>): Promise<this>;
  extendValidity(endDate: Date): Promise<this>;
  incrementUsage(): Promise<this>;
  activate(): Promise<this>;
  deactivate(): Promise<this>;
  isValid(): boolean;
  isExpired(): boolean;
  hasUsageLeft(): boolean;
  canBeUsedForTest(testId: Types.ObjectId): boolean;
  canBeUsedForCategory(category: string): boolean;
  canBeUsedOnDay(dayOfWeek: number): boolean;
  canBeUsedAtTime(timeSlot: string): boolean;
  getRemainingUsage(): number | null;
}

// Embedded Schemas
const OfferConditionsSchema = new Schema<OfferConditions>({
  minAmount: { type: Number, min: 0 },
  applicableTests: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
  applicableCategories: [String],
  dayOfWeek: {
    type: [Number],
    validate: {
      validator: function(v: number[]) {
        return !v || v.every(day => day >= 0 && day <= 6);
      },
      message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
    }
  },
  timeSlots: [String]
}, { _id: false });

const OfferValiditySchema = new Schema<OfferValidity>({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { _id: false });

const OfferUsageLimitSchema = new Schema<OfferUsageLimit>({
  total: { type: Number, min: 0 },
  perUser: { type: Number, min: 0 },
  used: { type: Number, default: 0, min: 0 }
}, { _id: false });

// Main Schema
const SlotSpecialOfferSchema = new Schema<SlotSpecialOfferMongoDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'organizations', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  offerType: {
    type: String,
    enum: ['percentage', 'fixed', 'bundle', 'freeAddon'],
    required: true
  },
  discount: { type: Number, min: 0 },
  conditions: { type: OfferConditionsSchema, required: true },
  validity: { type: OfferValiditySchema, required: true },
  usageLimit: { type: OfferUsageLimitSchema, required: true },
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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
SlotSpecialOfferSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
SlotSpecialOfferSchema.methods['updateOffer'] = function(updates: Partial<SlotSpecialOffer>) {
  Object.assign(this, updates);
  return this['save']();
};

SlotSpecialOfferSchema.methods['updateConditions'] = function(conditions: Partial<OfferConditions>) {
  Object.assign(this['conditions'], conditions);
  return this['save']();
};

SlotSpecialOfferSchema.methods['extendValidity'] = function(endDate: Date) {
  this['validity'].endDate = endDate;
  return this['save']();
};

SlotSpecialOfferSchema.methods['incrementUsage'] = function() {
  this['usageLimit'].used += 1;
  return this['save']();
};

SlotSpecialOfferSchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

SlotSpecialOfferSchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

SlotSpecialOfferSchema.methods['isValid'] = function(): boolean {
  if (!this['isActive']) return false;
  if (this['isExpired']()) return false;
  if (!this['hasUsageLeft']()) return false;
  return true;
};

SlotSpecialOfferSchema.methods['isExpired'] = function(): boolean {
  const now = new Date();
  return now < this['validity'].startDate || now > this['validity'].endDate;
};

SlotSpecialOfferSchema.methods['hasUsageLeft'] = function(): boolean {
  const limit = this['usageLimit'];
  if (limit.total && limit.used >= limit.total) return false;
  return true;
};

SlotSpecialOfferSchema.methods['canBeUsedForTest'] = function(testId: Types.ObjectId): boolean {
  const tests = this['conditions'].applicableTests;
  if (!tests || tests.length === 0) return true;
  return tests.some((id: Types.ObjectId) => id.equals(testId));
};

SlotSpecialOfferSchema.methods['canBeUsedForCategory'] = function(category: string): boolean {
  const categories = this['conditions'].applicableCategories;
  if (!categories || categories.length === 0) return true;
  return categories.includes(category);
};

SlotSpecialOfferSchema.methods['canBeUsedOnDay'] = function(dayOfWeek: number): boolean {
  const days = this['conditions'].dayOfWeek;
  if (!days || days.length === 0) return true;
  return days.includes(dayOfWeek);
};

SlotSpecialOfferSchema.methods['canBeUsedAtTime'] = function(timeSlot: string): boolean {
  const slots = this['conditions'].timeSlots;
  if (!slots || slots.length === 0) return true;
  return slots.includes(timeSlot);
};

SlotSpecialOfferSchema.methods['getRemainingUsage'] = function(): number | null {
  const limit = this['usageLimit'];
  if (!limit.total) return null;
  return Math.max(0, limit.total - limit.used);
};

// Validation
SlotSpecialOfferSchema.pre('save', function() {
  // Validate validity dates
  if (this['validity'].startDate >= this['validity'].endDate) {
    throw new Error('Start date must be before end date');
  }
  
  // Validate discount for percentage offers
  if (this['offerType'] === 'percentage' && this['discount'] && (this['discount'] < 0 || this['discount'] > 100)) {
    throw new Error('Percentage discount must be between 0 and 100');
  }
  
  // Validate usage limits
  const limit = this['usageLimit'];
  if (limit.perUser && limit.total && limit.perUser > limit.total) {
    throw new Error('Per user limit cannot exceed total limit');
  }
});

// Indexes
SlotSpecialOfferSchema.index({ organizationId: 1, isActive: 1, 'validity.startDate': 1 });
SlotSpecialOfferSchema.index({ organizationId: 1, 'validity.endDate': 1 });
SlotSpecialOfferSchema.index({ offerType: 1, isActive: 1 });
SlotSpecialOfferSchema.index({ 'conditions.applicableTests': 1 });
SlotSpecialOfferSchema.index({ title: 'text', description: 'text' });

export const SlotSpecialOfferModel = model<SlotSpecialOfferMongoDoc>('SlotSpecialOffer', SlotSpecialOfferSchema);