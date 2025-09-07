/**
 * Invoice Model for LabLoop Healthcare System
 * Comprehensive billing and payment tracking with line items and tax calculations
 * HIPAA-compliant with audit logging and payment processing integration
 */

import { Schema, model, Model, Types } from 'mongoose';
import { 
  IInvoice,
  IInvoiceLineItem,
  IInvoiceTotals,
  IPaymentTransaction,
  IInvoiceDiscount,
  ITaxBreakdown,
  IAddress,
  InvoiceStatus,
  PaymentMethod
} from '@/application/types/index.js';

// ====================== SUB-SCHEMAS ======================

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  itemType: {
    type: String,
    required: [true, 'Item type is required'],
    enum: ['test', 'package', 'homeCollection', 'discount', 'tax', 'other'],
  },
  itemId: {
    type: Schema.Types.ObjectId,
    refPath: 'lineItems.itemType',
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters'],
  },
  itemCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Item code cannot exceed 50 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Item description cannot exceed 500 characters'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative'],
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative'],
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
}, { _id: false });

const invoiceTotalsSchema = new Schema<IInvoiceTotals>({
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
  },
  discountTotal: {
    type: Number,
    default: 0,
    min: [0, 'Discount total cannot be negative'],
  },
  taxTotal: {
    type: Number,
    default: 0,
    min: [0, 'Tax total cannot be negative'],
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required'],
    min: [0, 'Grand total cannot be negative'],
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative'],
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Balance amount cannot be negative'],
  },
}, { _id: false });

const paymentTransactionSchema = new Schema<IPaymentTransaction>({
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required'],
    trim: true,
    maxlength: [100, 'Transaction ID cannot exceed 100 characters'],
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['cash', 'card', 'upi', 'netBanking', 'wallet', 'insurance', 'credit'] as PaymentMethod[],
      message: 'Invalid payment method',
    },
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative'],
  },
  paidAt: {
    type: Date,
    required: [true, 'Payment timestamp is required'],
    default: Date.now,
  },
  paidBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Paid by name cannot exceed 100 characters'],
  },
  reference: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment reference cannot exceed 100 characters'],
  },
  gateway: {
    type: String,
    trim: true,
    maxlength: [50, 'Gateway name cannot exceed 50 characters'],
  },
  status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    maxlength: [500, 'Payment notes cannot exceed 500 characters'],
    trim: true,
  },
}, { _id: false });

const invoiceDiscountSchema = new Schema<IInvoiceDiscount>({
  type: {
    type: String,
    required: [true, 'Discount type is required'],
    enum: ['percentage', 'fixed'],
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  },
  reason: {
    type: String,
    maxlength: [200, 'Discount reason cannot exceed 200 characters'],
    trim: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'users',
  },
  couponCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Coupon code cannot exceed 50 characters'],
  },
  applicableTests: {
    type: [Schema.Types.ObjectId],
    ref: 'tests',
    validate: {
      validator: (tests: Types.ObjectId[]) => tests.length <= 50,
      message: 'Cannot apply discount to more than 50 tests',
    },
  },
}, { _id: false });

const taxBreakdownSchema = new Schema<ITaxBreakdown>({
  taxName: {
    type: String,
    required: [true, 'Tax name is required'],
    trim: true,
    maxlength: [50, 'Tax name cannot exceed 50 characters'],
  },
  taxType: {
    type: String,
    required: [true, 'Tax type is required'],
    enum: ['percentage', 'fixed'],
  },
  taxRate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate cannot be negative'],
  },
  taxAmount: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax amount cannot be negative'],
  },
  applicableAmount: {
    type: Number,
    required: [true, 'Applicable amount is required'],
    min: [0, 'Applicable amount cannot be negative'],
  },
}, { _id: false });

const billingAddressSchema = new Schema<IAddress>({
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
}, { _id: false });

// ====================== MAIN INVOICE SCHEMA ======================

const invoiceSchema = new Schema<IInvoice>({
  invoiceId: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: (invoiceId: string) => /^INV[0-9]{8}$/.test(invoiceId),
      message: 'Invoice ID must follow pattern INV followed by 8 digits',
    },
  },
  invoiceNumber: {
    type: String,
    unique: true,
    required: [true, 'Invoice number is required'],
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters'],
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
  labId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Lab ID is required'],
    ref: 'labs',
  },
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'hospitals',
    sparse: true,
  },
  billingAddress: {
    type: billingAddressSchema,
    required: [true, 'Billing address is required'],
  },
  lineItems: {
    type: [invoiceLineItemSchema],
    required: [true, 'Line items are required'],
    validate: {
      validator: (items: IInvoiceLineItem[]) => items.length > 0 && items.length <= 100,
      message: 'Must have 1-100 line items',
    },
  },
  totals: {
    type: invoiceTotalsSchema,
    required: [true, 'Invoice totals are required'],
  },
  discounts: {
    type: [invoiceDiscountSchema],
    validate: {
      validator: (discounts: IInvoiceDiscount[]) => discounts.length <= 10,
      message: 'Cannot have more than 10 discounts',
    },
  },
  taxes: {
    type: [taxBreakdownSchema],
    validate: {
      validator: (taxes: ITaxBreakdown[]) => taxes.length <= 10,
      message: 'Cannot have more than 10 tax types',
    },
  },
  paymentTransactions: {
    type: [paymentTransactionSchema],
    validate: {
      validator: (transactions: IPaymentTransaction[]) => transactions.length <= 50,
      message: 'Cannot have more than 50 payment transactions',
    },
  },
  status: {
    type: String,
    required: [true, 'Invoice status is required'],
    enum: {
      values: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'] as InvoiceStatus[],
      message: 'Invalid invoice status',
    },
    default: 'draft',
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now,
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(this: IInvoice, dueDate: Date) {
        return !dueDate || dueDate >= this.issueDate;
      },
      message: 'Due date cannot be before issue date',
    },
  },
  paidDate: {
    type: Date,
    validate: {
      validator: function(this: IInvoice, paidDate: Date) {
        return !paidDate || this.status === 'paid';
      },
      message: 'Paid date can only be set when invoice is paid',
    },
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true,
  },
  internalNotes: {
    type: String,
    maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
    trim: true,
  },
  paymentTerms: {
    type: String,
    maxlength: [500, 'Payment terms cannot exceed 500 characters'],
    trim: true,
  },
  issuedBy: {
    type: Schema.Types.ObjectId,
    required: [true, 'Issued by user is required'],
    ref: 'users',
  },
  customerGstin: {
    type: String,
    trim: true,
    maxlength: [15, 'GSTIN cannot exceed 15 characters'],
    validate: {
      validator: (gstin: string) => !gstin || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin),
      message: 'Invalid GSTIN format',
    },
  },
  placeOfSupply: {
    type: String,
    trim: true,
    maxlength: [100, 'Place of supply cannot exceed 100 characters'],
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

invoiceSchema.index({ invoiceId: 1 }, { unique: true });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ patientId: 1, issueDate: -1 });
invoiceSchema.index({ labId: 1, status: 1 });
invoiceSchema.index({ caseId: 1 }, { sparse: true });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ 'totals.grandTotal': -1 });
invoiceSchema.index({ 'metadata.deletedAt': 1 }, { sparse: true });

// ====================== VIRTUAL PROPERTIES ======================

invoiceSchema.virtual('isPaid').get(function () {
  return this.status === 'paid';
});

invoiceSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'paid';
});

invoiceSchema.virtual('totalPaid').get(function () {
  return this.paymentTransactions
    ?.filter(t => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0) || 0;
});

invoiceSchema.virtual('remainingBalance').get(function () {
  return this.totals.grandTotal - this.totalPaid;
});

// ====================== MIDDLEWARE ======================

invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceId) {
    this.invoiceId = await generateInvoiceId();
  }

  if (this.isNew && !this.invoiceNumber) {
    this.invoiceNumber = await generateInvoiceNumber(this.labId);
  }

  if (this.isModified() && !this.isNew) {
    this.metadata.updatedAt = new Date();
  }

  // Calculate totals from line items
  if (this.isModified('lineItems')) {
    this.calculateTotals();
  }

  // Update paid amount and status based on successful transactions
  const successfulPayments = this.paymentTransactions?.filter(t => t.status === 'success') || [];
  this.totals.paidAmount = successfulPayments.reduce((sum, t) => sum + t.amount, 0);
  this.totals.balanceAmount = this.totals.grandTotal - this.totals.paidAmount;

  // Update status based on payments
  if (this.totals.paidAmount >= this.totals.grandTotal && this.status !== 'paid') {
    this.status = 'paid';
    this.paidDate = new Date();
  } else if (this.totals.paidAmount > 0 && this.totals.paidAmount < this.totals.grandTotal) {
    if (this.dueDate && this.dueDate < new Date()) {
      this.status = 'overdue';
    }
  }

  next();
});

invoiceSchema.pre(/^find/, function (next) {
  this.where({ 'metadata.deletedAt': { $exists: false } });
  next();
});

// ====================== INSTANCE METHODS ======================

invoiceSchema.methods.calculateTotals = function () {
  const subtotal = this.lineItems.reduce((sum: number, item: IInvoiceLineItem) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  const discountTotal = this.lineItems.reduce((sum: number, item: IInvoiceLineItem) => {
    return sum + (item.discountAmount || 0);
  }, 0);

  const taxTotal = this.lineItems.reduce((sum: number, item: IInvoiceLineItem) => {
    return sum + (item.taxAmount || 0);
  }, 0);

  this.totals = {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal: subtotal - discountTotal + taxTotal,
    paidAmount: this.totals?.paidAmount || 0,
    balanceAmount: 0, // Will be calculated after grandTotal
  };

  this.totals.balanceAmount = this.totals.grandTotal - this.totals.paidAmount;
};

invoiceSchema.methods.addPayment = function (
  amount: number,
  paymentMethod: PaymentMethod,
  transactionId: string,
  reference?: string
) {
  if (!this.paymentTransactions) {
    this.paymentTransactions = [];
  }

  this.paymentTransactions.push({
    transactionId,
    paymentMethod,
    amount,
    paidAt: new Date(),
    status: 'success',
    reference,
  } as any);

  return this.save();
};

invoiceSchema.methods.markAsPaid = function (paidDate?: Date) {
  this.status = 'paid';
  this.paidDate = paidDate || new Date();
  return this.save();
};

invoiceSchema.methods.cancel = function (reason?: string) {
  this.status = 'cancelled';
  if (reason) {
    this.internalNotes = (this.internalNotes || '') + `\nCancelled: ${reason}`;
  }
  return this.save();
};

// ====================== STATIC METHODS ======================

invoiceSchema.statics.findByInvoiceId = function (invoiceId: string) {
  return this.findOne({ invoiceId });
};

invoiceSchema.statics.findByInvoiceNumber = function (invoiceNumber: string) {
  return this.findOne({ invoiceNumber });
};

invoiceSchema.statics.findByPatient = function (patientId: Types.ObjectId) {
  return this.find({ patientId });
};

invoiceSchema.statics.findByLab = function (labId: Types.ObjectId, status?: InvoiceStatus) {
  const query: any = { labId };
  if (status) query.status = status;
  return this.find(query);
};

invoiceSchema.statics.findOverdue = function () {
  return this.find({
    dueDate: { $lt: new Date() },
    status: { $nin: ['paid', 'cancelled'] }
  });
};

// ====================== HELPER FUNCTIONS ======================

async function generateInvoiceId(): Promise<string> {
  const Invoice = model<IInvoice>('Invoice');
  let invoiceId: string;
  let exists: boolean;

  do {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    invoiceId = `INV${timestamp.slice(-4)}${random}`;
    exists = await Invoice.exists({ invoiceId });
  } while (exists);

  return invoiceId;
}

async function generateInvoiceNumber(labId: Types.ObjectId): Promise<string> {
  const Invoice = model<IInvoice>('Invoice');
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  
  const monthlyCount = await Invoice.countDocuments({
    labId,
    issueDate: {
      $gte: new Date(year, today.getMonth(), 1),
      $lt: new Date(year, today.getMonth() + 1, 1)
    }
  });
  
  const sequence = (monthlyCount + 1).toString().padStart(4, '0');
  const labSuffix = labId.toString().slice(-4).toUpperCase();
  
  return `INV${year}${month}${labSuffix}${sequence}`;
}

export const Invoice: Model<IInvoice> = model<IInvoice>('Invoice', invoiceSchema);
export default Invoice;