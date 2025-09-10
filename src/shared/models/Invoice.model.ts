import { Schema, model, Document, Types } from 'mongoose';
import { 
  Invoice, 
  InvoiceLineItem, 
  InvoicePricing, 
  InvoicePayment, 
  InvoiceInsurance
} from '../interfaces/Invoice.interface.js';
import { generateIdWithErrorHandling } from '../utils/idGenerator.js';

// MongoDB Document interface
export interface InvoiceMongoDoc 
  extends Document,
    Omit<Invoice, '_id' | 'caseId' | 'patientId' | 'organizationId' | 'lineItems' | 'createdBy' | 'approvedBy'> {
  caseId?: Types.ObjectId;
  patientId: Types.ObjectId;
  organizationId: Types.ObjectId;
  lineItems: (Omit<InvoiceLineItem, 'itemId'> & { itemId?: Types.ObjectId })[];
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  
  // Document methods
  generateInvoiceId(): Promise<string>;
  generateInvoiceNumber(): string;
  addLineItem(item: InvoiceLineItem): Promise<this>;
  removeLineItem(itemId: string): Promise<this>;
  updateLineItem(itemId: string, updates: Partial<InvoiceLineItem>): Promise<this>;
  recalculateTotals(): Promise<this>;
  applyDiscount(amount: number, description?: string): Promise<this>;
  addPayment(amount: number, method: InvoicePayment['paymentMethod'], transactionId?: string): Promise<this>;
  markPaid(paymentMethod?: InvoicePayment['paymentMethod'], transactionId?: string): Promise<this>;
  markOverdue(): Promise<this>;
  cancel(reason?: string): Promise<this>;
  refund(amount: number, reason?: string): Promise<this>;
  approve(userId: string): Promise<this>;
  isDue(): boolean;
  isOverdue(): boolean;
  getOutstandingAmount(): number;
}

// Embedded Schemas
const InvoiceLineItemSchema = new Schema<InvoiceLineItem>({
  itemType: {
    type: String,
    enum: ['test', 'service', 'package', 'consultation', 'discount', 'tax'],
    required: true
  },
  itemId: { type: Schema.Types.ObjectId },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoicePricingSchema = new Schema<InvoicePricing>({
  subtotal: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, default: 0, min: 0 },
  totalTax: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  balanceAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoicePaymentSchema = new Schema<InvoicePayment>({
  status: {
    type: String,
    enum: ['draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  dueDate: { type: Date, required: true },
  paidDate: Date,
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netBanking', 'cheque', 'insurance', 'corporate']
  },
  transactionId: String
}, { _id: false });

const InvoiceInsuranceSchema = new Schema<InvoiceInsurance>({
  provider: String,
  policyNumber: String,
  claimNumber: String,
  approvedAmount: { type: Number, min: 0 },
  status: {
    type: String,
    enum: ['notApplicable', 'pending', 'approved', 'rejected', 'partial'],
    default: 'notApplicable'
  }
}, { _id: false });

// Main Invoice Schema
const InvoiceSchema = new Schema<InvoiceMongoDoc>({
  invoiceId: { 
    type: String, 
    match: /^INV\d{8}$/,
    required: true
  },
  invoiceNumber: { type: String, required: true },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'organizations', required: true },
  billingType: {
    type: String,
    enum: ['case', 'test', 'package', 'consultation', 'other'],
    required: true
  },
  lineItems: [InvoiceLineItemSchema],
  pricing: { type: InvoicePricingSchema, required: true },
  payment: { type: InvoicePaymentSchema, required: true },
  insurance: { type: InvoiceInsuranceSchema, required: true },
  notes: { type: String, maxlength: 500 },
  termsAndConditions: { type: String, maxlength: 1000 },
  
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
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Middleware
InvoiceSchema.pre('save', function() {
  if (this.isModified() && !this.isNew) {
    this['updatedAt'] = new Date();
  }
});

// Methods
InvoiceSchema.methods['generateInvoiceId'] = async function(): Promise<string> {
  return await generateIdWithErrorHandling('INV', 'Invoice', 'invoiceId');
};

InvoiceSchema.methods['generateInvoiceNumber'] = function(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${year}${month}${day}-${random}`;
};

InvoiceSchema.methods['addLineItem'] = function(item: InvoiceLineItem) {
  this['lineItems'].push(item);
  return this['recalculateTotals']();
};

InvoiceSchema.methods['removeLineItem'] = function(itemId: string) {
  this['lineItems'] = this['lineItems'].filter((item: InvoiceLineItem & { itemId?: Types.ObjectId }) => item.itemId?.toString() !== itemId);
  return this['recalculateTotals']();
};

InvoiceSchema.methods['updateLineItem'] = function(itemId: string, updates: Partial<InvoiceLineItem>) {
  const itemIndex = this['lineItems'].findIndex((item: InvoiceLineItem & { itemId?: Types.ObjectId }) => item.itemId?.toString() === itemId);
  if (itemIndex !== -1) {
    Object.assign(this['lineItems'][itemIndex] as InvoiceLineItem, updates);
    // Recalculate total price for the item
    const item = this['lineItems'][itemIndex];
    item.totalPrice = (item.unitPrice * item.quantity) - item.discount + item.tax;
  }
  return this['recalculateTotals']();
};

InvoiceSchema.methods['recalculateTotals'] = function() {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  
  this['lineItems'].forEach((item: InvoiceLineItem) => {
    subtotal += item.unitPrice * item.quantity;
    totalDiscount += item.discount;
    totalTax += item.tax;
  });
  
  const totalAmount = subtotal - totalDiscount + totalTax;
  const balanceAmount = totalAmount - this['pricing'].paidAmount;
  
  this['pricing'] = {
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount,
    paidAmount: this['pricing'].paidAmount,
    balanceAmount
  };
  
  return this['save']();
};

InvoiceSchema.methods['applyDiscount'] = function(amount: number, description?: string) {
  const discountItem: InvoiceLineItem = {
    itemType: 'discount',
    description: description || 'Discount Applied',
    quantity: 1,
    unitPrice: -amount,
    discount: 0,
    tax: 0,
    totalPrice: -amount
  };
  
  return this['addLineItem'](discountItem);
};

InvoiceSchema.methods['addPayment'] = function(amount: number, method: InvoicePayment['paymentMethod'], transactionId?: string) {
  this['pricing'].paidAmount += amount;
  this['pricing'].balanceAmount = this['pricing'].totalAmount - this['pricing'].paidAmount;
  
  if (this['pricing'].balanceAmount <= 0) {
    this['payment'].status = 'paid';
    this['payment'].paidDate = new Date();
  } else {
    this['payment'].status = 'partial';
  }
  
  if (method) {
    this['payment'].paymentMethod = method;
  }
  if (transactionId) {
    this['payment'].transactionId = transactionId;
  }
  
  return this['save']();
};

InvoiceSchema.methods['markPaid'] = function(paymentMethod?: InvoicePayment['paymentMethod'], transactionId?: string) {
  this['pricing'].paidAmount = this['pricing'].totalAmount;
  this['pricing'].balanceAmount = 0;
  this['payment'].status = 'paid';
  this['payment'].paidDate = new Date();
  
  if (paymentMethod) {
    this['payment'].paymentMethod = paymentMethod;
  }
  if (transactionId) {
    this['payment'].transactionId = transactionId;
  }
  
  return this['save']();
};

InvoiceSchema.methods['markOverdue'] = function() {
  if (this['payment'].status === 'pending' || this['payment'].status === 'partial') {
    this['payment'].status = 'overdue';
  }
  return this['save']();
};

InvoiceSchema.methods['cancel'] = function(reason?: string) {
  this['payment'].status = 'cancelled';
  if (reason) {
    this['notes'] = (this['notes'] || '') + `\nCancelled: ${reason}`;
  }
  return this['save']();
};

InvoiceSchema.methods['refund'] = function(amount: number, reason?: string) {
  this['pricing'].paidAmount = Math.max(0, this['pricing'].paidAmount - amount);
  this['pricing'].balanceAmount = this['pricing'].totalAmount - this['pricing'].paidAmount;
  this['payment'].status = 'refunded';
  
  if (reason) {
    this['notes'] = (this['notes'] || '') + `\nRefund: ${amount} - ${reason}`;
  }
  
  return this['save']();
};

InvoiceSchema.methods['approve'] = function(userId: string) {
  this['approvedBy'] = userId;
  if (this['payment'].status === 'draft') {
    this['payment'].status = 'pending';
  }
  return this['save']();
};

InvoiceSchema.methods['isDue'] = function(): boolean {
  return this['payment'].status === 'pending' || this['payment'].status === 'partial';
};

InvoiceSchema.methods['isOverdue'] = function(): boolean {
  const now = new Date();
  return this['payment'].dueDate < now && this['isDue']();
};

InvoiceSchema.methods['getOutstandingAmount'] = function(): number {
  return this['pricing'].balanceAmount;
};

// Pre-save middleware for invoiceId and invoiceNumber generation
InvoiceSchema.pre('save', async function() {
  if (this.isNew && !this['invoiceId']) {
    this['invoiceId'] = await generateIdWithErrorHandling('INV', 'Invoice', 'invoiceId');
  }
  if (this.isNew && !this['invoiceNumber']) {
    this['invoiceNumber'] = this['generateInvoiceNumber']();
  }
});

// Indexes
InvoiceSchema.index({ invoiceId: 1 }, { unique: true });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ caseId: 1 }, { sparse: true });
InvoiceSchema.index({ patientId: 1, 'payment.status': 1 });
InvoiceSchema.index({ organizationId: 1, 'payment.status': 1 });
InvoiceSchema.index({ 'payment.dueDate': 1, 'payment.status': 1 });
InvoiceSchema.index({ invoiceId: 'text', invoiceNumber: 'text' });

export const InvoiceModel = model<InvoiceMongoDoc>('Invoice', InvoiceSchema);