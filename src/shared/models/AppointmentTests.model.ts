import { Schema, model, Document, Types } from 'mongoose';

// Interfaces
export interface TestSnapshot {
  id?: string;
  name: string;
  category?: string;
  price?: number;
  discountedPrice?: number;
  sampleType?: string;
  fastingRequired?: string;
}

export interface TestPreparation {
  instructions?: string;
  fastingHours?: number;
  waterAllowed: boolean;
  medicationsToAvoid?: string[];
}

export interface TestStatus {
  sampleCollected: boolean;
  reportReady: boolean;
}

export interface AppointmentTest {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  testId: Types.ObjectId;
  testSnapshot: TestSnapshot;
  preparation: TestPreparation;
  status: TestStatus;
  createdAt: Date;
}

// MongoDB Document interface
export interface AppointmentTestMongoDoc 
  extends Document, 
    Omit<AppointmentTest, '_id'> {
  
  // Document methods
  markSampleCollected(): Promise<this>;
  markReportReady(): Promise<this>;
  updatePreparation(preparation: Partial<TestPreparation>): Promise<this>;
  updateTestSnapshot(snapshot: Partial<TestSnapshot>): Promise<this>;
  addMedicationToAvoid(medication: string): Promise<this>;
  removeMedicationToAvoid(medication: string): Promise<this>;
  isSampleCollected(): boolean;
  isReportReady(): boolean;
  isCompleted(): boolean;
}

// Embedded Schemas
const TestSnapshotSchema = new Schema<TestSnapshot>({
  id: String,
  name: { type: String, required: true },
  category: String,
  price: { type: Number, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  sampleType: String,
  fastingRequired: String
}, { _id: false });

const TestPreparationSchema = new Schema<TestPreparation>({
  instructions: String,
  fastingHours: { type: Number, min: 0 },
  waterAllowed: { type: Boolean, default: true },
  medicationsToAvoid: [String]
}, { _id: false });

const TestStatusSchema = new Schema<TestStatus>({
  sampleCollected: { type: Boolean, default: false },
  reportReady: { type: Boolean, default: false }
}, { _id: false });

// Main Schema
const AppointmentTestSchema = new Schema<AppointmentTestMongoDoc>({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  testSnapshot: { type: TestSnapshotSchema, required: true },
  preparation: { type: TestPreparationSchema, required: true },
  status: { type: TestStatusSchema, required: true },
  
  // Audit fields
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Methods
AppointmentTestSchema.methods['markSampleCollected'] = function() {
  this['status'].sampleCollected = true;
  return this['save']();
};

AppointmentTestSchema.methods['markReportReady'] = function() {
  this['status'].reportReady = true;
  return this['save']();
};

AppointmentTestSchema.methods['updatePreparation'] = function(preparation: Partial<TestPreparation>) {
  Object.assign(this['preparation'], preparation);
  return this['save']();
};

AppointmentTestSchema.methods['updateTestSnapshot'] = function(snapshot: Partial<TestSnapshot>) {
  Object.assign(this['testSnapshot'], snapshot);
  return this['save']();
};

AppointmentTestSchema.methods['addMedicationToAvoid'] = function(medication: string) {
  if (!this['preparation'].medicationsToAvoid) {
    this['preparation'].medicationsToAvoid = [];
  }
  
  if (!this['preparation'].medicationsToAvoid.includes(medication)) {
    this['preparation'].medicationsToAvoid.push(medication);
  }
  
  return this['save']();
};

AppointmentTestSchema.methods['removeMedicationToAvoid'] = function(medication: string) {
  if (this['preparation'].medicationsToAvoid) {
    this['preparation'].medicationsToAvoid = this['preparation'].medicationsToAvoid.filter((med: string) => med !== medication);
  }
  return this['save']();
};

AppointmentTestSchema.methods['isSampleCollected'] = function(): boolean {
  return this['status'].sampleCollected;
};

AppointmentTestSchema.methods['isReportReady'] = function(): boolean {
  return this['status'].reportReady;
};

AppointmentTestSchema.methods['isCompleted'] = function(): boolean {
  return this['status'].sampleCollected && this['status'].reportReady;
};

// Validation
AppointmentTestSchema.pre('save', function() {
  // Validate price logic
  const snapshot = this['testSnapshot'];
  if (snapshot.discountedPrice && snapshot.price && snapshot.discountedPrice > snapshot.price) {
    throw new Error('Discounted price cannot be greater than original price');
  }
  
  // Validate fasting hours
  const preparation = this['preparation'];
  if (preparation.fastingHours && preparation.fastingHours > 24) {
    throw new Error('Fasting hours cannot exceed 24 hours');
  }
});

// Indexes
AppointmentTestSchema.index({ appointmentId: 1, testId: 1 }, { unique: true });
AppointmentTestSchema.index({ appointmentId: 1 });
AppointmentTestSchema.index({ testId: 1 });
AppointmentTestSchema.index({ 'status.sampleCollected': 1, 'status.reportReady': 1 });

export const AppointmentTestModel = model<AppointmentTestMongoDoc>('AppointmentTest', AppointmentTestSchema);