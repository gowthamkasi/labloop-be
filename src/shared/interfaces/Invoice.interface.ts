export interface InvoiceLineItem {
  itemType: 'test' | 'service' | 'package' | 'consultation' | 'discount' | 'tax';
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

export interface InvoicePricing {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export interface InvoicePayment {
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'netBanking' | 'cheque' | 'insurance' | 'corporate';
  transactionId?: string;
}

export interface InvoiceInsurance {
  provider?: string;
  policyNumber?: string;
  claimNumber?: string;
  approvedAmount?: number;
  status?: 'notApplicable' | 'pending' | 'approved' | 'rejected' | 'partial';
}

export interface Invoice {
  _id: string;
  invoiceId: string; // INV00000001 format
  invoiceNumber: string;
  caseId?: string;
  patientId: string;
  organizationId: string;
  billingType: 'case' | 'test' | 'package' | 'consultation' | 'other';
  lineItems: InvoiceLineItem[];
  pricing: InvoicePricing;
  payment: InvoicePayment;
  insurance: InvoiceInsurance;
  notes?: string;
  termsAndConditions?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  approvedBy?: string;
}