import { Schema, model, Document, Types } from 'mongoose';
import { 
  Appointment, 
  AppointmentScheduling, 
  AppointmentLocation, 
  AppointmentServices, 
  AppointmentAssignment, 
  AppointmentStatus, 
  AppointmentReminders, 
  AppointmentFacilitySnapshot, 
  AppointmentPatientSnapshot, 
  AppointmentCollectorInfo, 
  AppointmentDetails 
} from '../interfaces/Appointment.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface AppointmentMongoDoc 
  extends Document,
    Omit<Appointment, '_id' | 'patientId' | 'caseId' | 'organizationId' | 'services' | 'assignment' | 'createdBy'> {
  patientId: Types.ObjectId;
  caseId?: Types.ObjectId;
  organizationId: Types.ObjectId;
  services: Omit<AppointmentServices, 'testIds' | 'packageIds'> & {
    testIds: Types.ObjectId[];
    packageIds: Types.ObjectId[];
  };
  assignment: Omit<AppointmentAssignment, 'collectorId'> & {
    collectorId?: Types.ObjectId;
  };
  createdBy?: Types.ObjectId;
  
  // Document methods
  generateAppointmentId(): Promise<string>;
  getTimeUntilAppointment(): number;
  canBeModified(): boolean;
  reschedule(newDate: Date, newTime: string): Promise<this>;
  cancel(reason?: string): Promise<this>;
  confirm(): Promise<this>;
  markInProgress(): Promise<this>;
  complete(): Promise<this>;
  sendReminder(method: 'sms' | 'email' | 'push' | 'whatsapp'): Promise<this>;
}

// Embedded Schemas
const AppointmentSchedulingSchema = new Schema<AppointmentScheduling>({
  scheduledDate: { type: Date, required: true },
  scheduledTime: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  duration: { type: Number, default: 30, min: 15, max: 180 },
  timeSlotId: { type: Schema.Types.ObjectId, ref: 'AppointmentSlot' }
}, { _id: false });

const AppointmentLocationSchema = new Schema<AppointmentLocation>({
  type: { 
    type: String, 
    enum: ['onsite', 'home', 'virtual'], 
    required: true 
  },
  address: { type: String, maxlength: 500 },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  }
}, { _id: false });

const AppointmentServicesSchema = new Schema<AppointmentServices>({
  testIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Test'
  }],
  packageIds: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'HealthPackage'
  }],
  testCount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const AppointmentAssignmentSchema = new Schema<AppointmentAssignment>({
  collectorId: { type: Schema.Types.ObjectId, ref: 'User' },
  vehicleId: String,
  routeId: String
}, { _id: false });

const AppointmentStatusSchema = new Schema<AppointmentStatus>({
  current: {
    type: String,
    enum: ['pending', 'confirmed', 'inProgress', 'completed', 'cancelled', 'noShow', 'rescheduled'],
    default: 'pending'
  },
  confirmedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: { type: String, maxlength: 200 }
}, { _id: false });

const AppointmentRemindersSchema = new Schema<AppointmentReminders>({
  sent: { type: Boolean, default: false },
  sentAt: Date,
  method: { type: String, enum: ['sms', 'email', 'push', 'whatsapp'] }
}, { _id: false });

const AppointmentFacilitySnapshotSchema = new Schema<AppointmentFacilitySnapshot>({
  name: String,
  type: String,
  address: String,
  phone: String,
  distance: Number
}, { _id: false });

const AppointmentPatientSnapshotSchema = new Schema<AppointmentPatientSnapshot>({
  name: String,
  phone: String,
  age: Number,
  gender: String
}, { _id: false });

const AppointmentCollectorInfoSchema = new Schema<AppointmentCollectorInfo>({
  id: String,
  name: String,
  phone: String,
  rating: Number
}, { _id: false });

const AppointmentDetailsSchema = new Schema<AppointmentDetails>({
  totalCost: Number,
  estimatedDuration: Number,
  specialInstructions: { type: String, maxlength: 500 },
  homeAddress: { type: String, maxlength: 500 },
  canReschedule: { type: Boolean, default: true },
  canCancel: { type: Boolean, default: true }
}, { _id: false });

// Main Appointment Schema
const AppointmentSchema = new Schema<AppointmentMongoDoc>({
  appointmentId: { 
    type: String, 
    match: /^APT\d{8}$/,
    required: true
  },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'organizations', required: true },
  type: {
    type: String,
    enum: ['walkIn', 'scheduled', 'urgent', 'homeCollection', 'visitLab', 'teleconsultation'],
    required: true
  },
  scheduling: { type: AppointmentSchedulingSchema, required: true },
  location: { type: AppointmentLocationSchema, required: true },
  services: { type: AppointmentServicesSchema, required: true },
  assignment: { type: AppointmentAssignmentSchema, required: true },
  status: { type: AppointmentStatusSchema, required: true },
  reminders: { type: AppointmentRemindersSchema, required: true },
  notes: { type: String, maxlength: 1000 },
  facilitySnapshot: AppointmentFacilitySnapshotSchema,
  patientSnapshot: AppointmentPatientSnapshotSchema,
  collectorInfo: AppointmentCollectorInfoSchema,
  appointmentDetails: { type: AppointmentDetailsSchema, required: true },
  
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
AppointmentSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
AppointmentSchema.methods['generateAppointmentId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('APT', 'Appointment', 'appointmentId');
};

AppointmentSchema.methods['getTimeUntilAppointment'] = function(): number {
  const now = new Date();
  const scheduledDateTime = new Date(this['scheduling'].scheduledDate);
  const [hours, minutes] = this['scheduling'].scheduledTime.split(':').map(Number);
  scheduledDateTime.setHours(hours, minutes, 0, 0);
  
  return scheduledDateTime.getTime() - now.getTime();
};

AppointmentSchema.methods['canBeModified'] = function(): boolean {
  const timeUntilAppointment = this['getTimeUntilAppointment']();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  
  return timeUntilAppointment > twoHoursInMs && 
         this['status'].current !== 'completed' && 
         this['status'].current !== 'cancelled';
};

AppointmentSchema.methods['reschedule'] = function(newDate: Date, newTime: string) {
  if (!this['canBeModified']()) {
    throw new Error('Appointment cannot be modified');
  }
  
  this['scheduling'].scheduledDate = newDate;
  this['scheduling'].scheduledTime = newTime;
  this['status'].current = 'rescheduled';
  this['reminders'].sent = false;
  this['reminders'].sentAt = undefined;
  
  return this['save']();
};

AppointmentSchema.methods['cancel'] = function(reason?: string) {
  if (!this['canBeModified']()) {
    throw new Error('Appointment cannot be modified');
  }
  
  this['status'].current = 'cancelled';
  this['status'].cancelledAt = new Date();
  if (reason) {
    this['status'].cancellationReason = reason;
  }
  
  return this['save']();
};

AppointmentSchema.methods['confirm'] = function() {
  if (this['status'].current !== 'pending') {
    throw new Error('Only pending appointments can be confirmed');
  }
  
  this['status'].current = 'confirmed';
  this['status'].confirmedAt = new Date();
  
  return this['save']();
};

AppointmentSchema.methods['markInProgress'] = function() {
  if (this['status'].current !== 'confirmed') {
    throw new Error('Only confirmed appointments can be marked in progress');
  }
  
  this['status'].current = 'inProgress';
  this['status'].startedAt = new Date();
  
  return this['save']();
};

AppointmentSchema.methods['complete'] = function() {
  if (this['status'].current !== 'inProgress') {
    throw new Error('Only in-progress appointments can be completed');
  }
  
  this['status'].current = 'completed';
  this['status'].completedAt = new Date();
  
  return this['save']();
};

AppointmentSchema.methods['sendReminder'] = function(method: 'sms' | 'email' | 'push' | 'whatsapp') {
  this['reminders'].sent = true;
  this['reminders'].sentAt = new Date();
  this['reminders'].method = method;
  
  return this['save']();
};

// Pre-save middleware for appointmentId generation
AppointmentSchema.pre('save', async function() {
  if (this.isNew && !this['appointmentId']) {
    this['appointmentId'] = await generateIdWithErrorHandling('APT', 'Appointment', 'appointmentId');
  }
});

// Indexes
AppointmentSchema.index({ appointmentId: 1 }, { unique: true });
AppointmentSchema.index({ patientId: 1, 'scheduling.scheduledDate': 1 });
AppointmentSchema.index({ organizationId: 1, 'scheduling.scheduledDate': 1 });
AppointmentSchema.index({ type: 1, 'status.current': 1 });
AppointmentSchema.index({ 'assignment.collectorId': 1, 'scheduling.scheduledDate': 1 });
AppointmentSchema.index({ 'scheduling.scheduledDate': 1, 'scheduling.scheduledTime': 1 });
AppointmentSchema.index({ appointmentId: 'text', notes: 'text' });

export const AppointmentModel = model<AppointmentMongoDoc>('Appointment', AppointmentSchema);