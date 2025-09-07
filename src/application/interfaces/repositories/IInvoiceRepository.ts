/**
 * Invoice Repository Interface for LabLoop Healthcare System
 * Handles billing with line items and payment tracking
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IInvoice } from '../../types/index.js';

export interface IInvoiceRepository extends IBaseRepository<IInvoice> {
  // Basic invoice identification
  findByInvoiceId(invoiceId: string): Promise<IInvoice | null>;
  findByInvoiceNumber(invoiceNumber: string): Promise<IInvoice | null>;
  
  // Case and patient-related queries
  findByCaseId(caseId: string | Types.ObjectId): Promise<IInvoice[]>;
  findByPatientId(patientId: string | Types.ObjectId): Promise<IInvoice[]>;
  
  // Payment status management
  findByPaymentStatus(status: string): Promise<IInvoice[]>;
  findPendingPayments(): Promise<IInvoice[]>;
  findPaidInvoices(): Promise<IInvoice[]>;
  findOverdueInvoices(): Promise<IInvoice[]>;
  
  // Payment processing
  recordPayment(invoiceId: string | Types.ObjectId, payment: {
    amount: number;
    method: string;
    transactionId?: string;
    paidAt: Date;
    paidBy?: string;
    notes?: string;
  }): Promise<boolean>;
  
  updatePaymentStatus(invoiceId: string | Types.ObjectId, status: string): Promise<boolean>;
  addLateFee(invoiceId: string | Types.ObjectId, feeAmount: number): Promise<boolean>;
  applyDiscount(invoiceId: string | Types.ObjectId, discountAmount: number, reason: string): Promise<boolean>;
  
  // Provider and facility queries
  findByLabId(labId: string | Types.ObjectId): Promise<IInvoice[]>;
  findByHospitalId(hospitalId: string | Types.ObjectId): Promise<IInvoice[]>;
  
  // Date-based queries
  findByInvoiceDate(date: Date): Promise<IInvoice[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IInvoice[]>;
  findByDueDate(dueDate: Date): Promise<IInvoice[]>;
  
  // Amount-based queries
  findByAmountRange(minAmount: number, maxAmount: number): Promise<IInvoice[]>;
  findHighValueInvoices(threshold: number): Promise<IInvoice[]>;
  
  // Insurance and billing
  findByInsuranceProvider(provider: string): Promise<IInvoice[]>;
  findInsurancePendingClaims(): Promise<IInvoice[]>;
  updateInsuranceStatus(invoiceId: string | Types.ObjectId, status: string, claimNumber?: string): Promise<boolean>;
  
  // Search and filtering
  searchInvoices(query: {
    searchTerm?: string;
    paymentStatus?: string;
    patientId?: string | Types.ObjectId;
    caseId?: string | Types.ObjectId;
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
    amountRange?: { min: number; max: number };
    insuranceProvider?: string;
  }): Promise<IInvoice[]>;
  
  // Financial analytics
  getFinancialStats(filter?: {
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageInvoiceValue: number;
    paymentRate: number;
    averagePaymentTime: number;
    byPaymentStatus: Record<string, { count: number; amount: number }>;
  }>;
  
  // Revenue reporting
  getDailyRevenue(date: Date): Promise<number>;
  getMonthlyRevenue(year: number, month: number): Promise<number>;
  getRevenueByDateRange(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    dailyBreakdown: Array<{ date: Date; revenue: number }>;
  }>;
  
  // Outstanding amounts
  getOutstandingAmounts(labId?: string | Types.ObjectId): Promise<{
    totalOutstanding: number;
    aged30Days: number;
    aged60Days: number;
    aged90Days: number;
    aged120PlusDays: number;
  }>;
  
  // Batch operations
  bulkUpdatePaymentStatus(invoiceIds: (string | Types.ObjectId)[], status: string): Promise<{ modifiedCount: number }>;
  bulkApplyDiscount(invoiceIds: (string | Types.ObjectId)[], discountPercentage: number, reason: string): Promise<{ modifiedCount: number }>;
  
  // Collections and follow-up
  findInvoicesForCollection(daysOverdue: number): Promise<IInvoice[]>;
  markForCollection(invoiceId: string | Types.ObjectId, collectionAgency: string): Promise<boolean>;
  
  // Tax and compliance
  findByTaxPeriod(startDate: Date, endDate: Date): Promise<IInvoice[]>;
  getTaxSummary(startDate: Date, endDate: Date): Promise<{
    totalTaxableAmount: number;
    totalTaxAmount: number;
    byTaxRate: Record<string, { amount: number; tax: number }>;
  }>;
}