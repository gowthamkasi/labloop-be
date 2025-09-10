import { Schema, model, Document, Types, SchemaDefinitionProperty } from 'mongoose';

// Interfaces
export interface TimeSlot {
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available?: number;
  type: 'regular' | 'urgent' | 'homeCollection';
  isBlocked: boolean;
  blockReason?: string;
  price?: number;
  duration?: number;
}

export interface FacilityInfo {
  facilityName?: string;
  facilityId?: Types.ObjectId;
  specialOffersCount: number;
}

export interface SlotSchedule {
  templateId?: Types.ObjectId;
  isHoliday: boolean;
  holidayName?: string;
}

export interface AppointmentSlots {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  date: Date;
  slots: TimeSlot[];
  facilityInfo: FacilityInfo;
  schedule: SlotSchedule;
  createdAt: Date;
  updatedAt: Date;
  generatedBy?: Types.ObjectId;
}

// MongoDB Document interface
export interface AppointmentSlotsMongoDoc 
  extends Document, 
    Omit<AppointmentSlots, '_id'> {
  
  // Document methods
  addSlot(slot: TimeSlot): Promise<this>;
  removeSlot(startTime: string): Promise<this>;
  updateSlot(startTime: string, updates: Partial<TimeSlot>): Promise<this>;
  bookSlot(startTime: string, count?: number): Promise<this>;
  cancelBooking(startTime: string, count?: number): Promise<this>;
  blockSlot(startTime: string, reason?: string): Promise<this>;
  unblockSlot(startTime: string): Promise<this>;
  markAsHoliday(holidayName?: string): Promise<this>;
  unmarkAsHoliday(): Promise<this>;
  getAvailableSlots(): TimeSlot[];
  getSlotByTime(startTime: string): TimeSlot | null;
  getTotalCapacity(): number;
  getTotalBooked(): number;
  getTotalAvailable(): number;
  updateAvailability(): Promise<this>;
}

// Embedded Schemas
const TimeSlotSchema = new Schema<TimeSlot>({
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  booked: {
    type: Number,
    default: 0,
    min: 0
  },
  available: Number,
  type: {
    type: String,
    enum: ['regular', 'urgent', 'homeCollection'],
    default: 'regular'
  },
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  price: { type: Number, min: 0 },
  duration: { type: Number, min: 0 }
}, { _id: false });

const FacilityInfoSchema = new Schema<FacilityInfo>({
  facilityName: String,
  facilityId: { type: Schema.Types.ObjectId, ref: 'organizations' },
  specialOffersCount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const SlotScheduleSchema = new Schema<SlotSchedule>({
  templateId: { type: Schema.Types.ObjectId, sparse: true },
  isHoliday: { type: Boolean, default: false },
  holidayName: String
}, { _id: false });

// Main Schema
const AppointmentSlotsSchema = new Schema<AppointmentSlotsMongoDoc>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'organizations', required: true },
  date: { type: Date, required: true },
  slots: {
    type: [TimeSlotSchema],
    validate: {
      validator: function(v: TimeSlot[]) {
        return !v || v.length <= 100;
      },
      message: 'Cannot have more than 100 slots per day'
    }
  } as unknown as SchemaDefinitionProperty,
  facilityInfo: { type: FacilityInfoSchema, required: true },
  schedule: { type: SlotScheduleSchema, required: true },
  
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
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
AppointmentSlotsSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
  
  // Auto-calculate available count for all slots
  if (this['slots']) {
    this['slots'].forEach((slot: TimeSlot) => {
      slot.available = Math.max(0, slot.capacity - slot.booked);
    });
  }
});

// Methods
AppointmentSlotsSchema.methods['addSlot'] = function(slot: TimeSlot) {
  // Check for time conflicts
  const existingSlot = this['getSlotByTime'](slot.startTime);
  if (existingSlot) {
    throw new Error(`Slot already exists for time ${slot.startTime}`);
  }
  
  this['slots'].push(slot);
  return this['save']();
};

AppointmentSlotsSchema.methods['removeSlot'] = function(startTime: string) {
  this['slots'] = this['slots'].filter((slot: TimeSlot) => slot.startTime !== startTime);
  return this['save']();
};

AppointmentSlotsSchema.methods['updateSlot'] = function(startTime: string, updates: Partial<TimeSlot>) {
  const slot = this['getSlotByTime'](startTime);
  if (slot) {
    Object.assign(slot, updates);
  }
  return this['save']();
};

AppointmentSlotsSchema.methods['bookSlot'] = function(startTime: string, count: number = 1) {
  const slot = this['getSlotByTime'](startTime);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (slot.isBlocked) {
    throw new Error('Slot is blocked');
  }
  
  if (slot.booked + count > slot.capacity) {
    throw new Error('Insufficient capacity');
  }
  
  slot.booked += count;
  return this['save']();
};

AppointmentSlotsSchema.methods['cancelBooking'] = function(startTime: string, count: number = 1) {
  const slot = this['getSlotByTime'](startTime);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  slot.booked = Math.max(0, slot.booked - count);
  return this['save']();
};

AppointmentSlotsSchema.methods['blockSlot'] = function(startTime: string, reason?: string) {
  const slot = this['getSlotByTime'](startTime);
  if (slot) {
    slot.isBlocked = true;
    slot.blockReason = reason;
  }
  return this['save']();
};

AppointmentSlotsSchema.methods['unblockSlot'] = function(startTime: string) {
  const slot = this['getSlotByTime'](startTime);
  if (slot) {
    slot.isBlocked = false;
    delete slot.blockReason;
  }
  return this['save']();
};

AppointmentSlotsSchema.methods['markAsHoliday'] = function(holidayName?: string) {
  this['schedule'].isHoliday = true;
  this['schedule'].holidayName = holidayName;
  
  // Block all slots on holiday
  this['slots'].forEach((slot: TimeSlot) => {
    slot.isBlocked = true;
    slot.blockReason = 'Holiday';
  });
  
  return this['save']();
};

AppointmentSlotsSchema.methods['unmarkAsHoliday'] = function() {
  this['schedule'].isHoliday = false;
  this['schedule'].holidayName = undefined;
  
  // Unblock slots that were blocked for holiday
  this['slots'].forEach((slot: TimeSlot) => {
    if (slot.blockReason === 'Holiday') {
      slot.isBlocked = false;
      delete slot.blockReason;
    }
  });
  
  return this['save']();
};

AppointmentSlotsSchema.methods['getAvailableSlots'] = function(): TimeSlot[] {
  return this['slots'].filter((slot: TimeSlot) => !slot.isBlocked && slot.booked < slot.capacity);
};

AppointmentSlotsSchema.methods['getSlotByTime'] = function(startTime: string): TimeSlot | null {
  return this['slots'].find((slot: TimeSlot) => slot.startTime === startTime) || null;
};

AppointmentSlotsSchema.methods['getTotalCapacity'] = function(): number {
  return this['slots'].reduce((total: number, slot: TimeSlot) => total + slot.capacity, 0);
};

AppointmentSlotsSchema.methods['getTotalBooked'] = function(): number {
  return this['slots'].reduce((total: number, slot: TimeSlot) => total + slot.booked, 0);
};

AppointmentSlotsSchema.methods['getTotalAvailable'] = function(): number {
  return this['slots'].reduce((total: number, slot: TimeSlot) => {
    return total + (slot.isBlocked ? 0 : Math.max(0, slot.capacity - slot.booked));
  }, 0);
};

AppointmentSlotsSchema.methods['updateAvailability'] = function() {
  this['slots'].forEach((slot: TimeSlot) => {
    slot.available = Math.max(0, slot.capacity - slot.booked);
  });
  return this['save']();
};

// Validation
AppointmentSlotsSchema.pre('save', function() {
  // Validate slot times and booking logic
  this['slots'].forEach((slot: TimeSlot) => {
    if (slot.booked > slot.capacity) {
      throw new Error(`Booked count (${slot.booked}) cannot exceed capacity (${slot.capacity}) for slot ${slot.startTime}`);
    }
    
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      throw new Error('Invalid time format. Use HH:MM format');
    }
    
    // Validate end time is after start time
    if (slot.startTime >= slot.endTime) {
      throw new Error('End time must be after start time');
    }
  });
});

// Indexes
AppointmentSlotsSchema.index({ organizationId: 1, date: 1 }, { unique: true });
AppointmentSlotsSchema.index({ date: 1, 'schedule.isHoliday': 1 });
AppointmentSlotsSchema.index({ organizationId: 1, date: 1, 'slots.type': 1 });

export const AppointmentSlotsModel = model<AppointmentSlotsMongoDoc>('AppointmentSlots', AppointmentSlotsSchema);