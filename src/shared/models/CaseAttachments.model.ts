import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface CaseAttachment {
  _id: Types.ObjectId;
  caseId: Types.ObjectId;
  type: 'prescription' | 'previousReport' | 'image' | 'document' | 'other';
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
}

// MongoDB Document interface
export interface CaseAttachmentMongoDoc 
  extends Document, 
    Omit<CaseAttachment, '_id'> {
  
  // Document methods
  updateDescription(description: string): Promise<this>;
  updateThumbnail(thumbnailUrl: string): Promise<this>;
  getFileExtension(): string;
  isImage(): boolean;
  isDocument(): boolean;
  getReadableFileSize(): string;
  getTimeSinceUpload(): string;
}

// Main Schema
const CaseAttachmentSchema = new Schema<CaseAttachmentMongoDoc>({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  type: {
    type: String,
    enum: ['prescription', 'previousReport', 'image', 'document', 'other'],
    required: true
  },
  fileName: { type: String, required: true, trim: true },
  fileSize: { type: Number, min: 0 },
  mimeType: { type: String, trim: true },
  url: { type: String, required: true, trim: true },
  thumbnailUrl: { type: String, trim: true },
  description: { type: String, maxlength: 200, trim: true },
  
  // Audit fields
  uploadedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Methods
CaseAttachmentSchema.methods['updateDescription'] = function(description: string) {
  this['description'] = description;
  return this['save']();
};

CaseAttachmentSchema.methods['updateThumbnail'] = function(thumbnailUrl: string) {
  this['thumbnailUrl'] = thumbnailUrl;
  return this['save']();
};

CaseAttachmentSchema.methods['getFileExtension'] = function(): string {
  const fileName = this['fileName'];
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
};

CaseAttachmentSchema.methods['isImage'] = function(): boolean {
  const mimeType = this['mimeType'];
  if (mimeType) {
    return mimeType.startsWith('image/');
  }
  
  const extension = this['getFileExtension']();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(extension);
};

CaseAttachmentSchema.methods['isDocument'] = function(): boolean {
  const mimeType = this['mimeType'];
  if (mimeType) {
    return mimeType.startsWith('application/') || mimeType.startsWith('text/');
  }
  
  const extension = this['getFileExtension']();
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'];
  return documentExtensions.includes(extension);
};

CaseAttachmentSchema.methods['getReadableFileSize'] = function(): string {
  const fileSize = this['fileSize'];
  if (!fileSize) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = fileSize;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

CaseAttachmentSchema.methods['getTimeSinceUpload'] = function(): string {
  const uploadedAt = this['uploadedAt'];
  const now = new Date();
  const diffMs = now.getTime() - uploadedAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
};

// Validation
CaseAttachmentSchema.pre('save', function() {
  // Validate URL format
  const url = this['url'];
  if (url && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    throw new Error('URL must start with http://, https://, or file://');
  }
  
  // Validate file size (max 100MB)
  const fileSize = this['fileSize'];
  if (fileSize && fileSize > 100 * 1024 * 1024) {
    throw new Error('File size cannot exceed 100MB');
  }
  
  // Auto-detect type based on mime type if not set correctly
  const mimeType = this['mimeType'];
  if (mimeType) {
    if (mimeType.startsWith('image/') && this['type'] === 'other') {
      this['type'] = 'image';
    } else if (mimeType === 'application/pdf' && this['type'] === 'other') {
      this['type'] = 'document';
    }
  }
});

// Indexes
CaseAttachmentSchema.index({ caseId: 1, type: 1 });
CaseAttachmentSchema.index({ uploadedAt: -1 });
CaseAttachmentSchema.index({ uploadedBy: 1, uploadedAt: -1 });

export const CaseAttachmentModel = model<CaseAttachmentMongoDoc>('CaseAttachment', CaseAttachmentSchema);