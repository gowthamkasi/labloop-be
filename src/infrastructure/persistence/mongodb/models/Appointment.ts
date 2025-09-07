/**
 * Appointment Model for LabLoop Healthcare System
 * Comprehensive scheduling system with conflict prevention and slot management
 * HIPAA-compliant with audit logging and automated reminders
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  IAppointment,
  IAppointmentSlot,
  IAppointmentDetails,
  IAppointmentLocation,
  IAppointmentCancellation,
  IAppointmentReschedule,
  IAddress,
  AppointmentStatus,
  AppointmentType,
  AppointmentSlotStatus,
  CasePriority,
  PaymentStatus,
  SampleType
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const appointmentSlotSchema = new Schema<IAppointmentSlot>({
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
    validate: {
      validator: function(this: IAppointmentSlot, endTime: Date) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time',
    },
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours'],
  },
  status: {
    type: String,
    required: [true, 'Slot status is required'],
    enum: {
      values: ['available', 'booked', 'blocked', 'unavailable'] as AppointmentSlotStatus[],
      message: 'Invalid slot status',
    },
    default: 'available',
  },
  maxCapacity: {
    type: Number,
    min: [1, 'Max capacity must be at least 1'],
    default: 1,
  },
  currentBookings: {
    type: Number,
    default: 0,
    min: [0, 'Current bookings cannot be negative'],
    validate: {
      validator: function(this: IAppointmentSlot, current: number) {
        return !this.maxCapacity || current <= this.maxCapacity;
      },
      message: 'Current bookings cannot exceed max capacity',
    },
  },
}, { _id: false });

const appointmentDetailsSchema = new Schema<IAppointmentDetails>({
  appointmentId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Appointment ID is required'],
    ref: 'appointments',
  },
  testId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Test ID is required'],
    ref: 'tests',
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    maxlength: [200, 'Test name cannot exceed 200 characters'],
  },
  sampleType: {
    type: String,
    enum: {
      values: ['blood', 'urine', 'stool', 'sputum', 'tissue', 'csf', 'other'] as SampleType[],
      message: 'Invalid sample type',
    },
  },
  specialInstructions: {
    type: [String],
    validate: {
      validator: (instructions: string[]) => instructions.length <= 10,
      message: 'Cannot have more than 10 special instructions',
    },
  },
  estimatedDuration: {
    type: Number,
    min: [5, 'Estimated duration must be at least 5 minutes'],
    max: [120, 'Estimated duration cannot exceed 2 hours'],
  },
}, { _id: false });

const appointmentLocationSchema = new Schema<IAppointmentLocation>({
  type: {
    type: String,
    required: [true, 'Location type is required'],
    enum: ['lab', 'hospital', 'collectionCenter', 'home'],
  },
  locationId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Location ID is required'],
    refPath: 'location.type',
  },
  locationName: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [200, 'Location name cannot exceed 200 characters'],
  },
  address: {
    street: {
      type: String,
      maxlength: [200, 'Street address cannot exceed 200 characters'],
      trim: true,
    },
    city: {
      type: String,
      maxlength: [100, 'City name cannot exceed 100 characters'],
      trim: true,
    },
    state: {
      type: String,
      maxlength: [100, 'State name cannot exceed 100 characters'],
      trim: true,
    },
    zipCode: {
      type: String,
      validate: {
        validator: (zip: string) => !zip || /^[0-9]{5,10}$/.test(zip),
        message: 'ZIP code must be 5-10 digits',
      },
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (coords: number[]) => !coords || (coords.length === 2 && coords.every(c => typeof c === 'number')),
          message: 'Coordinates must be an array of two numbers [longitude, latitude]',
        },
      },
    },
  },
  contactPerson: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      validate: {
        validator: (phone: string) => !phone || /^\+?[1-9]\d{1,14}$/.test(phone),
        message: 'Contact phone must be a valid phone number',
      },
    },
  },
}, { _id: false });

const appointmentCancellationSchema = new Schema<IAppointmentCancellation>({
  cancelledBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Cancelled by user is required'],
    ref: 'users',
  },
  cancelledAt: {
    type: Date,
    required: [true, 'Cancellation timestamp is required'],
    default: Date.now,
  },
  reason: {
    type: String,
    required: [true, 'Cancellation reason is required'],
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'declined'],
    validate: {
      validator: function(this: IAppointmentCancellation, status: string) {
        return !this.refundAmount || !!status;
      },
      message: 'Refund status is required when refund amount is provided',
    },
  },
}, { _id: false });

const appointmentRescheduleSchema = new Schema<IAppointmentReschedule>({
  rescheduledBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Rescheduled by user is required'],
    ref: 'users',
  },
  rescheduledAt: {
    type: Date,
    required: [true, 'Reschedule timestamp is required'],
    default: Date.now,
  },
  originalSlot: {
    type: appointmentSlotSchema,
    required: [true, 'Original slot is required'],
  },
  newSlot: {
    type: appointmentSlotSchema,
    required: [true, 'New slot is required'],
  },
  reason: {
    type: String,
    maxlength: [500, 'Reschedule reason cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

// ====================== MAIN APPOINTMENT SCHEMA ======================

const appointmentSchema = new Schema<IAppointment>({
  appointmentId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (appointmentId: string) => /^APT[0-9]{8}$/.test(appointmentId),
      message: 'Appointment ID must follow pattern APT followed by 8 digits',
    },
  },
  appointmentNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Appointment number cannot exceed 50 characters'],
  },
  caseId: {
    type: Schema.Types.ObjectId,
    ref: 'cases',
    sparse: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Patient ID is required'],
    ref: 'patients',
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Patient name cannot exceed 100 characters'],
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    validate: {
      validator: (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone),
      message: 'Please provide a valid phone number',
    },
  },
  labId: {
    type: Schema.Types.ObjectId,
    ref: 'labs',
    sparse: true,
  },
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'hospitals',
    sparse: true,
  },
  appointmentType: {
    type: String,
    required: [true, 'Appointment type is required'],
    enum: {
      values: ['sampleCollection', 'consultation', 'reportDelivery', 'followUp'] as AppointmentType[],
      message: 'Invalid appointment type',
    },
  },
  status: {
    type: String,
    required: [true, 'Appointment status is required'],
    enum: {
      values: ['scheduled', 'confirmed', 'checkedIn', 'inProgress', 'completed', 'cancelled', 'noShow', 'rescheduled'] as AppointmentStatus[],
      message: 'Invalid appointment status',
    },
    default: 'scheduled',
  },
  priority: {
    type: String,
    required: [true, 'Appointment priority is required'],
    enum: {
      values: ['routine', 'urgent', 'stat', 'critical'] as CasePriority[],
      message: 'Invalid appointment priority',
    },
    default: 'routine',
  },
  slot: {
    type: appointmentSlotSchema,
    required: [true, 'Appointment slot is required'],
  },
  location: {
    type: appointmentLocationSchema,
    required: [true, 'Appointment location is required'],
  },
  testDetails: {
    type: [appointmentDetailsSchema],
    required: [true, 'Test details are required'],
    validate: {
      validator: (details: IAppointmentDetails[]) => details.length > 0 && details.length <= 20,
      message: 'Must have 1-20 test details',
    },
  },
  totalAmount: {
    type: Number,
    min: [0, 'Total amount cannot be negative'],
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'partial', 'paid', 'refunded', 'cancelled'] as PaymentStatus[],
      message: 'Invalid payment status',
    },
    default: 'pending',
  },
  specialRequests: {
    type: String,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters'],
    trim: true,
  },
  patientNotes: {
    type: String,
    maxlength: [2000, 'Patient notes cannot exceed 2000 characters'],
    trim: true,
  },
  internalNotes: {
    type: String,
    maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
    trim: true,
  },
  assignedStaff: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    sparse: true,
  },
  checkedInAt: {
    type: Date,
    validate: {
      validator: function(this: IAppointment, date: Date) {
        return !date || date >= this.slot.startTime;
      },
      message: 'Check-in time cannot be before appointment start time',
    },
  },
  completedAt: {
    type: Date,
    validate: {
      validator: function(this: IAppointment, date: Date) {
        return !date || this.status === 'completed';
      },
      message: 'Completed time can only be set when appointment is completed',
    },
  },
  cancellation: appointmentCancellationSchema,
  reschedule: appointmentRescheduleSchema,
  remindersSent: {
    type: [Date],
    validate: {
      validator: (dates: Date[]) => dates.length <= 10,
      message: 'Cannot have more than 10 reminder entries',
    },
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    trim: true,
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
  timestamps: false,
  versionKey: false,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
  toObject: { 
    virtuals: true,
  },
});

// ====================== INDEXES ======================

appointmentSchema.index({ appointmentId: 1 }, { unique: true });
appointmentSchema.index({ appointmentNumber: 1 }, { unique: true, sparse: true });
appointmentSchema.index({ patientId: 1, 'slot.startTime': -1 });
appointmentSchema.index({ labId: 1, status: 1 }, { sparse: true });
appointmentSchema.index({ hospitalId: 1, status: 1 }, { sparse: true });
appointmentSchema.index({ status: 1, 'slot.startTime': 1 });
appointmentSchema.index({ appointmentType: 1, status: 1 });
appointmentSchema.index({ 'slot.startTime': 1, 'slot.endTime': 1 });
appointmentSchema.index({ assignedStaff: 1, 'slot.startTime': 1 }, { sparse: true });
appointmentSchema.index({ caseId: 1 }, { sparse: true });
appointmentSchema.index({ priority: -1, 'slot.startTime': 1 });
appointmentSchema.index({ 'location.locationId': 1, 'slot.startTime': 1 });
appointmentSchema.index({ patientPhone: 1 });
appointmentSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });

// Text search index
appointmentSchema.index({
  appointmentId: 'text',
  appointmentNumber: 'text',
  patientName: 'text',
  patientPhone: 'text',
  'location.locationName': 'text'
});

// Compound indexes for common queries
appointmentSchema.index({ 
  'slot.startTime': 1, 
  status: 1, 
  'location.locationId': 1 
});
appointmentSchema.index({ 
  patientId: 1, 
  status: 1, 
  'slot.startTime': -1 
});

// ====================== VIRTUAL PROPERTIES ======================

appointmentSchema.virtual('isActive').get(function () {
  return !['completed', 'cancelled', 'noShow'].includes(this.status);
});

appointmentSchema.virtual('isUpcoming').get(function () {
  return this.slot.startTime > new Date() && this.isActive;
});

appointmentSchema.virtual('isPast').get(function () {
  return this.slot.endTime < new Date();
});

appointmentSchema.virtual('duration').get(function () {
  return this.slot.duration;
});

appointmentSchema.virtual('testCount').get(function () {
  return this.testDetails?.length || 0;
});

appointmentSchema.virtual('hasPayment').get(function () {
  return this.totalAmount && this.totalAmount > 0;
});

appointmentSchema.virtual('isFullyPaid').get(function () {
  return this.paymentStatus === 'paid';
});

appointmentSchema.virtual('balanceAmount').get(function () {
  return (this.totalAmount || 0) - (this.paidAmount || 0);
});

// ====================== MIDDLEWARE ======================

appointmentSchema.pre('save', async function (next) {
  if (this.isNew && !this.appointmentId) {
    this.appointmentId = await generateAppointmentId();
  }

  if (this.isNew && !this.appointmentNumber) {
    this.appointmentNumber = await generateAppointmentNumber(this.labId || this.hospitalId);
  }

  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Calculate slot duration if not provided
  if (this.slot && !this.slot.duration) {
    const durationMs = this.slot.endTime.getTime() - this.slot.startTime.getTime();
    this.slot.duration = Math.floor(durationMs / (1000 * 60)); // Convert to minutes
  }

  // Set slot status based on appointment status
  if (this.isModified('status')) {
    if (['cancelled', 'noShow'].includes(this.status)) {
      this.slot.status = 'available';
    } else if (this.status === 'scheduled' || this.status === 'confirmed') {
      this.slot.status = 'booked';
    }
  }

  // Auto-complete appointment if all tests are done
  if (this.status === 'inProgress' && this.completedAt) {
    this.status = 'completed';
  }

  next();
});

appointmentSchema.pre('validate', function (next) {
  // Validate appointment time is in the future for new appointments
  if (this.isNew && this.slot.startTime < new Date()) {
    this.invalidate('slot.startTime', 'Appointment time must be in the future');
  }

  // Ensure end time is after start time
  if (this.slot.endTime <= this.slot.startTime) {
    this.invalidate('slot.endTime', 'End time must be after start time');
  }

  // Validate payment logic
  if (this.paidAmount > (this.totalAmount || 0)) {
    this.invalidate('paidAmount', 'Paid amount cannot exceed total amount');
  }

  next();
});

appointmentSchema.post('save', function (doc, next) {
  console.log(`Appointment ${doc.appointmentId} for ${doc.patientName} has been saved with status: ${doc.status}`);
  next();
});

appointmentSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

appointmentSchema.methods.checkIn = function (checkedInBy?: Types.ObjectId) {
  this.status = 'checkedIn';
  this.checkedInAt = new Date();
  if (checkedInBy) {
    this.metadata.updatedBy = checkedInBy;
  }
  return this.save();
};

appointmentSchema.methods.complete = function (completedBy?: Types.ObjectId) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (completedBy) {
    this.metadata.updatedBy = completedBy;
  }
  return this.save();
};

appointmentSchema.methods.cancel = function (
  reason: string,
  cancelledBy: Types.ObjectId,
  refundAmount?: number
) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledBy,
    cancelledAt: new Date(),
    reason,
    refundAmount,
    refundStatus: refundAmount ? 'pending' : undefined,
  } as any;
  return this.save();
};

appointmentSchema.methods.reschedule = function (
  newSlot: IAppointmentSlot,
  rescheduledBy: Types.ObjectId,
  reason?: string
) {
  const originalSlot = { ...this.slot };
  
  this.reschedule = {
    rescheduledBy,
    rescheduledAt: new Date(),
    originalSlot,
    newSlot,
    reason,
  } as any;
  
  this.slot = newSlot;
  this.status = 'rescheduled';
  
  return this.save();
};

appointmentSchema.methods.addReminder = function () {
  if (!this.remindersSent) {
    this.remindersSent = [];
  }
  this.remindersSent.push(new Date());
  return this.save();
};

appointmentSchema.methods.addRating = function (rating: number, feedback?: string) {
  this.rating = rating;
  if (feedback) {
    this.feedback = feedback;
  }
  return this.save();
};

appointmentSchema.methods.assignStaff = function (staffId: Types.ObjectId) {
  this.assignedStaff = staffId;
  return this.save();
};

// ====================== STATIC METHODS ======================

appointmentSchema.statics.findByAppointmentId = function (appointmentId: string) {
  return this.findOne({ appointmentId });
};

appointmentSchema.statics.findByPatient = function (patientId: Types.ObjectId) {
  return this.find({ patientId });
};

appointmentSchema.statics.findByLocation = function (locationId: Types.ObjectId, date?: Date) {
  const query: any = { 'location.locationId': locationId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query['slot.startTime'] = { $gte: startOfDay, $lte: endOfDay };
  }
  
  return this.find(query);
};

appointmentSchema.statics.findUpcoming = function (hours: number = 24) {
  const now = new Date();
  const future = new Date(now.getTime() + (hours * 60 * 60 * 1000));
  
  return this.find({
    'slot.startTime': { $gte: now, $lte: future },
    status: { $in: ['scheduled', 'confirmed'] }
  });
};

appointmentSchema.statics.findByDateRange = function (startDate: Date, endDate: Date) {
  return this.find({
    'slot.startTime': { $gte: startDate, $lte: endDate }
  });
};

appointmentSchema.statics.findByStatus = function (status: AppointmentStatus) {
  return this.find({ status });
};

// ====================== HELPER FUNCTIONS ======================

async function generateAppointmentId(): Promise<string> {
  const Appointment = model<IAppointment>('Appointment');
  let appointmentId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    appointmentId = `APT${timestamp.slice(-4)}${random}`;
    exists = await Appointment.exists({ appointmentId });
  } while (exists);

  return appointmentId;
}

async function generateAppointmentNumber(locationId?: Types.ObjectId): Promise<string> {
  const Appointment = model<IAppointment>('Appointment');
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  const query: any = {
    'metadata.createdAt': {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lte: new Date(today.setHours(23, 59, 59, 999))
    }
  };
  
  if (locationId) {
    query['location.locationId'] = locationId;
  }
  
  const dailyCount = await Appointment.countDocuments(query);
  const sequence = (dailyCount + 1).toString().padStart(3, '0');
  
  const locationSuffix = locationId ? locationId.toString().slice(-2).toUpperCase() : 'XX';
  
  return `A${year}${month}${day}${locationSuffix}${sequence}`;
}

export const Appointment: Model<IAppointment> = model<IAppointment>('Appointment', appointmentSchema);
export default Appointment;