import { Schema, model, Document, Types } from 'mongoose';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// Interfaces
export interface ReviewAspects {
  cleanliness?: number;
  staff?: number;
  waitTime?: number;
  facilities?: number;
}

export interface ReviewResponse {
  text?: string;
  respondedBy?: Types.ObjectId;
  respondedAt?: Date;
}

export interface ReviewHelpful {
  count: number;
  users?: Types.ObjectId[];
}

export interface OrganizationReview {
  _id: Types.ObjectId;
  reviewId: string;
  organizationId: Types.ObjectId;
  patientId?: Types.ObjectId;
  patientName: string;
  rating: number;
  comment?: string;
  aspects: ReviewAspects;
  images?: string[];
  verified: boolean;
  verificationMethod?: 'booking' | 'report' | 'manual';
  response: ReviewResponse;
  helpful: ReviewHelpful;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  deviceType?: string;
}

// MongoDB Document interface
export interface OrganizationReviewMongoDoc 
  extends Document, 
    Omit<OrganizationReview, '_id'> {
  
  // Document methods
  generateReviewId(): Promise<string>;
  updateRating(rating: number): Promise<this>;
  updateComment(comment: string): Promise<this>;
  updateAspects(aspects: Partial<ReviewAspects>): Promise<this>;
  addImage(imageUrl: string): Promise<this>;
  removeImage(imageUrl: string): Promise<this>;
  verify(method: 'booking' | 'report' | 'manual'): Promise<this>;
  respond(text: string, respondedBy: Types.ObjectId): Promise<this>;
  markHelpful(userId: Types.ObjectId): Promise<this>;
  unmarkHelpful(userId: Types.ObjectId): Promise<this>;
  hide(): Promise<this>;
  show(): Promise<this>;
  softDelete(): Promise<this>;
  getAverageAspectRating(): number;
  isHelpfulByUser(userId: Types.ObjectId): boolean;
}

// Embedded Schemas
const ReviewAspectsSchema = new Schema<ReviewAspects>({
  cleanliness: { type: Number, min: 1, max: 5 },
  staff: { type: Number, min: 1, max: 5 },
  waitTime: { type: Number, min: 1, max: 5 },
  facilities: { type: Number, min: 1, max: 5 }
}, { _id: false });

const ReviewResponseSchema = new Schema<ReviewResponse>({
  text: { type: String, maxlength: 500 },
  respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  respondedAt: Date
}, { _id: false });

const ReviewHelpfulSchema = new Schema<ReviewHelpful>({
  count: { type: Number, default: 0, min: 0 },
  users: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
    validate: {
      validator: function(v: Types.ObjectId[]) {
        return !v || v.length <= 1000;
      },
      message: 'Cannot have more than 1000 helpful votes'
    }
  }
}, { _id: false });

// Main Schema
const OrganizationReviewSchema = new Schema<OrganizationReviewMongoDoc>({
  reviewId: { 
    type: String, 
    match: /^REV\d{8}$/,
    required: true
  },
  organizationId: { type: Schema.Types.ObjectId, ref: 'organizations', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', sparse: true },
  patientName: { type: String, required: true, trim: true },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: { type: String, maxlength: 1000, trim: true },
  aspects: { type: ReviewAspectsSchema, required: true },
  images: {
    type: [String],
    validate: {
      validator: function(v: string[]) {
        return !v || v.length <= 5;
      },
      message: 'Cannot have more than 5 images'
    }
  },
  verified: { type: Boolean, default: false },
  verificationMethod: {
    type: String,
    enum: ['booking', 'report', 'manual']
  },
  response: { type: ReviewResponseSchema, required: true },
  helpful: { type: ReviewHelpfulSchema, required: true },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  },
  
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
  ipAddress: String,
  deviceType: String
});

// Middleware
OrganizationReviewSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
OrganizationReviewSchema.methods['generateReviewId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('REV', 'OrganizationReview', 'reviewId');
};

OrganizationReviewSchema.methods['updateRating'] = function(rating: number) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  this['rating'] = rating;
  return this['save']();
};

OrganizationReviewSchema.methods['updateComment'] = function(comment: string) {
  this['comment'] = comment;
  return this['save']();
};

OrganizationReviewSchema.methods['updateAspects'] = function(aspects: Partial<ReviewAspects>) {
  Object.assign(this['aspects'], aspects);
  return this['save']();
};

OrganizationReviewSchema.methods['addImage'] = function(imageUrl: string) {
  if (!this['images']) {
    this['images'] = [];
  }
  
  if (!this['images'].includes(imageUrl)) {
    this['images'].push(imageUrl);
  }
  
  return this['save']();
};

OrganizationReviewSchema.methods['removeImage'] = function(imageUrl: string) {
  if (this['images']) {
    this['images'] = this['images'].filter((img: string) => img !== imageUrl);
  }
  return this['save']();
};

OrganizationReviewSchema.methods['verify'] = function(method: 'booking' | 'report' | 'manual') {
  this['verified'] = true;
  this['verificationMethod'] = method;
  return this['save']();
};

OrganizationReviewSchema.methods['respond'] = function(text: string, respondedBy: Types.ObjectId) {
  this['response'].text = text;
  this['response'].respondedBy = respondedBy;
  this['response'].respondedAt = new Date();
  return this['save']();
};

OrganizationReviewSchema.methods['markHelpful'] = function(userId: Types.ObjectId) {
  if (!this['helpful'].users) {
    this['helpful'].users = [];
  }
  
  if (!this['isHelpfulByUser'](userId)) {
    this['helpful'].users.push(userId);
    this['helpful'].count = this['helpful'].users.length;
  }
  
  return this['save']();
};

OrganizationReviewSchema.methods['unmarkHelpful'] = function(userId: Types.ObjectId) {
  if (this['helpful'].users) {
    this['helpful'].users = this['helpful'].users.filter((id: Types.ObjectId) => !id.equals(userId));
    this['helpful'].count = this['helpful'].users.length;
  }
  
  return this['save']();
};

OrganizationReviewSchema.methods['hide'] = function() {
  this['status'] = 'hidden';
  return this['save']();
};

OrganizationReviewSchema.methods['show'] = function() {
  this['status'] = 'active';
  return this['save']();
};

OrganizationReviewSchema.methods['softDelete'] = function() {
  this['status'] = 'deleted';
  return this['save']();
};

OrganizationReviewSchema.methods['getAverageAspectRating'] = function(): number {
  const aspects = this['aspects'];
  const ratings = [aspects.cleanliness, aspects.staff, aspects.waitTime, aspects.facilities].filter(r => r != null);
  
  if (ratings.length === 0) return 0;
  
  const sum = ratings.reduce((total: number, rating: number) => total + rating, 0);
  return Number((sum / ratings.length).toFixed(1));
};

OrganizationReviewSchema.methods['isHelpfulByUser'] = function(userId: Types.ObjectId): boolean {
  return this['helpful'].users?.some((id: Types.ObjectId) => id.equals(userId)) || false;
};

// Pre-save middleware for reviewId generation
OrganizationReviewSchema.pre('save', async function() {
  if (this.isNew && !this['reviewId']) {
    this['reviewId'] = await generateIdWithErrorHandling('REV', 'OrganizationReview', 'reviewId');
  }
});

// Validation
OrganizationReviewSchema.pre('save', function() {
  // Validate aspect ratings
  const aspects = this['aspects'];
  [aspects.cleanliness, aspects.staff, aspects.waitTime, aspects.facilities].forEach((rating, index) => {
    if (rating != null && (rating < 1 || rating > 5)) {
      const aspectNames = ['cleanliness', 'staff', 'waitTime', 'facilities'];
      throw new Error(`${aspectNames[index]} rating must be between 1 and 5`);
    }
  });
});

// Indexes
OrganizationReviewSchema.index({ reviewId: 1 }, { unique: true });
OrganizationReviewSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
OrganizationReviewSchema.index({ organizationId: 1, rating: -1 });
OrganizationReviewSchema.index({ patientId: 1 }, { sparse: true });
OrganizationReviewSchema.index({ verified: 1, rating: -1 });
OrganizationReviewSchema.index({ comment: 'text' });

export const OrganizationReviewModel = model<OrganizationReviewMongoDoc>('OrganizationReview', OrganizationReviewSchema);