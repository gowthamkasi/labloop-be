import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface FacilityCertification {
  _id: Types.ObjectId;
  facilityId: Types.ObjectId;
  facilityType: 'hospital' | 'lab' | 'clinic';
  name: string;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
  documentUrl?: string;
  verificationUrl?: string;
  status: 'active' | 'expired' | 'pending' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface FacilityCertificationMongoDoc 
  extends Document, 
    Omit<FacilityCertification, '_id'> {
  
  // Document methods
  updateStatus(status: 'active' | 'expired' | 'pending' | 'revoked'): Promise<this>;
  checkExpiry(): Promise<this>;
  isExpired(): boolean;
  isActive(): boolean;
  updateDocument(documentUrl: string): Promise<this>;
  updateVerification(verificationUrl: string): Promise<this>;
  extend(newExpiryDate: Date): Promise<this>;
  revoke(): Promise<this>;
  getDaysUntilExpiry(): number | null;
}

// Main Schema
const FacilityCertificationSchema = new Schema<FacilityCertificationMongoDoc>({
  facilityId: { type: Schema.Types.ObjectId, required: true },
  facilityType: {
    type: String,
    enum: ['hospital', 'lab', 'clinic'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true },
  issuedBy: { type: String, required: true, trim: true },
  issuedDate: { type: Date, required: true },
  expiryDate: Date,
  documentUrl: { type: String, trim: true },
  verificationUrl: { type: String, trim: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'revoked'],
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
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
FacilityCertificationSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
  
  // Auto-update status based on expiry
  if (this['expiryDate'] && new Date() > this['expiryDate'] && this['status'] === 'active') {
    this['status'] = 'expired';
  }
});

// Methods
FacilityCertificationSchema.methods['updateStatus'] = function(status: 'active' | 'expired' | 'pending' | 'revoked') {
  this['status'] = status;
  return this['save']();
};

FacilityCertificationSchema.methods['checkExpiry'] = function() {
  if (this['isExpired']() && this['status'] === 'active') {
    this['status'] = 'expired';
  }
  return this['save']();
};

FacilityCertificationSchema.methods['isExpired'] = function(): boolean {
  return this['expiryDate'] ? new Date() > this['expiryDate'] : false;
};

FacilityCertificationSchema.methods['isActive'] = function(): boolean {
  return this['status'] === 'active' && !this['isExpired']();
};

FacilityCertificationSchema.methods['updateDocument'] = function(documentUrl: string) {
  this['documentUrl'] = documentUrl;
  return this['save']();
};

FacilityCertificationSchema.methods['updateVerification'] = function(verificationUrl: string) {
  this['verificationUrl'] = verificationUrl;
  return this['save']();
};

FacilityCertificationSchema.methods['extend'] = function(newExpiryDate: Date) {
  this['expiryDate'] = newExpiryDate;
  if (this['status'] === 'expired') {
    this['status'] = 'active';
  }
  return this['save']();
};

FacilityCertificationSchema.methods['revoke'] = function() {
  this['status'] = 'revoked';
  return this['save']();
};

FacilityCertificationSchema.methods['getDaysUntilExpiry'] = function(): number | null {
  if (!this['expiryDate']) return null;
  
  const today = new Date();
  const expiry = this['expiryDate'];
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Validation
FacilityCertificationSchema.pre('save', function() {
  // Validate dates
  if (this['expiryDate'] && this['issuedDate'] && this['expiryDate'] <= this['issuedDate']) {
    throw new Error('Expiry date must be after issued date');
  }
  
  // Validate URLs
  const urlPattern = /^https?:\/\/.+/;
  if (this['documentUrl'] && !urlPattern.test(this['documentUrl'])) {
    throw new Error('Document URL must be a valid HTTP/HTTPS URL');
  }
  
  if (this['verificationUrl'] && !urlPattern.test(this['verificationUrl'])) {
    throw new Error('Verification URL must be a valid HTTP/HTTPS URL');
  }
});

// Indexes
FacilityCertificationSchema.index({ facilityId: 1, facilityType: 1 });
FacilityCertificationSchema.index({ facilityId: 1, status: 1 });
FacilityCertificationSchema.index({ number: 1, issuedBy: 1 }, { unique: true });
FacilityCertificationSchema.index({ status: 1, expiryDate: 1 });
FacilityCertificationSchema.index({ name: 'text', issuedBy: 'text' });

export const FacilityCertificationModel = model<FacilityCertificationMongoDoc>('FacilityCertification', FacilityCertificationSchema);