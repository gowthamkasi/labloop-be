import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface FacilityGallery {
  _id: Types.ObjectId;
  facilityId: Types.ObjectId;
  facilityType: 'hospital' | 'lab' | 'clinic' | 'collectionCenter';
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  category?: 'facility' | 'equipment' | 'staff' | 'certificate' | 'other';
  order: number;
  isActive: boolean;
  createdAt: Date;
  uploadedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface FacilityGalleryMongoDoc 
  extends Document, 
    Omit<FacilityGallery, '_id'> {
  
  // Document methods
  updateCaption(caption: string): Promise<this>;
  updateOrder(order: number): Promise<this>;
  updateCategory(category: 'facility' | 'equipment' | 'staff' | 'certificate' | 'other'): Promise<this>;
  setThumbnail(thumbnailUrl: string): Promise<this>;
  activate(): Promise<this>;
  deactivate(): Promise<this>;
}

// Main Schema
const FacilityGallerySchema = new Schema<FacilityGalleryMongoDoc>({
  facilityId: { type: Schema.Types.ObjectId, required: true },
  facilityType: {
    type: String,
    enum: ['hospital', 'lab', 'clinic', 'collectionCenter'],
    required: true
  },
  imageUrl: { type: String, required: true, trim: true },
  thumbnailUrl: { type: String, trim: true },
  caption: { type: String, maxlength: 200, trim: true },
  category: {
    type: String,
    enum: ['facility', 'equipment', 'staff', 'certificate', 'other']
  },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Methods
FacilityGallerySchema.methods['updateCaption'] = function(caption: string) {
  this['caption'] = caption;
  return this['save']();
};

FacilityGallerySchema.methods['updateOrder'] = function(order: number) {
  this['order'] = order;
  return this['save']();
};

FacilityGallerySchema.methods['updateCategory'] = function(category: 'facility' | 'equipment' | 'staff' | 'certificate' | 'other') {
  this['category'] = category;
  return this['save']();
};

FacilityGallerySchema.methods['setThumbnail'] = function(thumbnailUrl: string) {
  this['thumbnailUrl'] = thumbnailUrl;
  return this['save']();
};

FacilityGallerySchema.methods['activate'] = function() {
  this['isActive'] = true;
  return this['save']();
};

FacilityGallerySchema.methods['deactivate'] = function() {
  this['isActive'] = false;
  return this['save']();
};

// Validation
FacilityGallerySchema.pre('save', function() {
  // Validate image URL
  const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  if (!urlPattern.test(this['imageUrl'])) {
    throw new Error('Image URL must be a valid HTTP/HTTPS URL with image extension');
  }
  
  // Validate thumbnail URL if provided
  if (this['thumbnailUrl'] && !urlPattern.test(this['thumbnailUrl'])) {
    throw new Error('Thumbnail URL must be a valid HTTP/HTTPS URL with image extension');
  }
});

// Indexes
FacilityGallerySchema.index({ facilityId: 1, facilityType: 1, order: 1 });
FacilityGallerySchema.index({ facilityId: 1, isActive: 1 });
FacilityGallerySchema.index({ category: 1, isActive: 1 });

export const FacilityGalleryModel = model<FacilityGalleryMongoDoc>('FacilityGallery', FacilityGallerySchema);