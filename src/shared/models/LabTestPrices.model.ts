import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface TestPricing {
  basePrice: number;
  discountedPrice?: number;
  homeCollectionCharge: number;
  urgentProcessingCharge: number;
}

export interface TestOffer {
  type: 'percentage' | 'fixed' | 'bundle';
  value: number;
  validFrom: Date;
  validUntil: Date;
  conditions?: string;
}

export interface TestTurnaround {
  standard: number;
  urgent?: number;
  unit: 'hours' | 'days';
}

export interface LabTestPrice {
  _id: Types.ObjectId;
  labId: Types.ObjectId;
  testId: Types.ObjectId;
  testName: string;
  category: string;
  pricing: TestPricing;
  offers?: TestOffer[];
  turnaround: TestTurnaround;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface LabTestPriceMongoDoc 
  extends Document, 
    Omit<LabTestPrice, '_id'> {
  
  // Document methods
  updatePricing(pricing: Partial<TestPricing>): Promise<this>;
  addOffer(offer: TestOffer): Promise<this>;
  removeOffer(offerIndex: number): Promise<this>;
  updateTurnaround(turnaround: Partial<TestTurnaround>): Promise<this>;
  setAvailability(available: boolean): Promise<this>;
  getCurrentPrice(): number;
  getActiveOffers(): TestOffer[];
  isOfferValid(offer: TestOffer): boolean;
  calculateDiscountedPrice(): number;
}

// Embedded Schemas
const TestPricingSchema = new Schema<TestPricing>({
  basePrice: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  homeCollectionCharge: { type: Number, default: 0, min: 0 },
  urgentProcessingCharge: { type: Number, default: 0, min: 0 }
}, { _id: false });

const TestOfferSchema = new Schema<TestOffer>({
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'bundle'],
    required: true
  },
  value: { type: Number, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  conditions: String
}, { _id: false });

const TestTurnaroundSchema = new Schema<TestTurnaround>({
  standard: { type: Number, required: true, min: 0 },
  urgent: { type: Number, min: 0 },
  unit: {
    type: String,
    enum: ['hours', 'days'],
    default: 'hours'
  }
}, { _id: false });

// Main Schema
const LabTestPriceSchema = new Schema<LabTestPriceMongoDoc>({
  labId: { type: Schema.Types.ObjectId, ref: 'Lab', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  testName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  pricing: { type: TestPricingSchema, required: true },
  offers: [TestOfferSchema],
  turnaround: { type: TestTurnaroundSchema, required: true },
  isAvailable: { type: Boolean, default: true },
  
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
LabTestPriceSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
LabTestPriceSchema.methods['updatePricing'] = function(pricing: Partial<TestPricing>) {
  Object.assign(this['pricing'], pricing);
  return this['save']();
};

LabTestPriceSchema.methods['addOffer'] = function(offer: TestOffer) {
  if (!this['offers']) {
    this['offers'] = [];
  }
  this['offers'].push(offer);
  return this['save']();
};

LabTestPriceSchema.methods['removeOffer'] = function(offerIndex: number) {
  if (this['offers'] && this['offers'][offerIndex]) {
    this['offers'].splice(offerIndex, 1);
  }
  return this['save']();
};

LabTestPriceSchema.methods['updateTurnaround'] = function(turnaround: Partial<TestTurnaround>) {
  Object.assign(this['turnaround'], turnaround);
  return this['save']();
};

LabTestPriceSchema.methods['setAvailability'] = function(available: boolean) {
  this['isAvailable'] = available;
  return this['save']();
};

LabTestPriceSchema.methods['getCurrentPrice'] = function(): number {
  const pricing = this['pricing'];
  return pricing.discountedPrice || pricing.basePrice;
};

LabTestPriceSchema.methods['getActiveOffers'] = function(): TestOffer[] {
  if (!this['offers']) return [];
  
  return this['offers'].filter((offer: TestOffer) => this['isOfferValid'](offer));
};

LabTestPriceSchema.methods['isOfferValid'] = function(offer: TestOffer): boolean {
  const now = new Date();
  return offer.validFrom <= now && offer.validUntil >= now;
};

LabTestPriceSchema.methods['calculateDiscountedPrice'] = function(): number {
  const basePrice = this['pricing'].basePrice;
  const activeOffers = this['getActiveOffers']();
  
  if (activeOffers.length === 0) {
    return basePrice;
  }
  
  // Apply the best offer
  let bestPrice = basePrice;
  activeOffers.forEach((offer: TestOffer) => {
    let discountedPrice: number;
    
    if (offer.type === 'percentage') {
      discountedPrice = basePrice * (1 - offer.value / 100);
    } else if (offer.type === 'fixed') {
      discountedPrice = Math.max(0, basePrice - offer.value);
    } else {
      discountedPrice = basePrice; // Bundle offers handled differently
    }
    
    if (discountedPrice < bestPrice) {
      bestPrice = discountedPrice;
    }
  });
  
  return bestPrice;
};

// Validation
LabTestPriceSchema.pre('save', function() {
  // Validate pricing
  const pricing = this['pricing'];
  if (pricing.discountedPrice && pricing.discountedPrice > pricing.basePrice) {
    throw new Error('Discounted price cannot be greater than base price');
  }
  
  // Validate offers
  if (this['offers']) {
    this['offers'].forEach((offer: TestOffer) => {
      if (offer.validFrom >= offer.validUntil) {
        throw new Error('Offer valid from date must be before valid until date');
      }
      
      if (offer.type === 'percentage' && (offer.value < 0 || offer.value > 100)) {
        throw new Error('Percentage offer value must be between 0 and 100');
      }
      
      if (offer.type === 'fixed' && offer.value < 0) {
        throw new Error('Fixed offer value cannot be negative');
      }
    });
  }
});

// Indexes
LabTestPriceSchema.index({ labId: 1, testId: 1 }, { unique: true });
LabTestPriceSchema.index({ labId: 1, category: 1, isAvailable: 1 });
LabTestPriceSchema.index({ labId: 1, 'pricing.basePrice': 1 });
LabTestPriceSchema.index({ testId: 1, isAvailable: 1 });
LabTestPriceSchema.index({ testName: 'text' });

export const LabTestPriceModel = model<LabTestPriceMongoDoc>('LabTestPrice', LabTestPriceSchema);