/**
 * Appointment Repository Interface for LabLoop Healthcare System
 * Handles scheduling with slot management and booking system
 */

import { Types } from 'mongoose';
import { IBaseRepository } from './index.js';
import { IAppointment } from '../../types/index.js';

export interface IAppointmentRepository extends IBaseRepository<IAppointment> {
  // Basic appointment identification
  findByAppointmentId(appointmentId: string): Promise<IAppointment | null>;
  
  // Patient and case-related queries
  findByPatientId(patientId: string | Types.ObjectId): Promise<IAppointment[]>;
  findByCaseId(caseId: string | Types.ObjectId): Promise<IAppointment[]>;
  
  // Status and workflow management
  findByStatus(status: string): Promise<IAppointment[]>;
  findPendingAppointments(): Promise<IAppointment[]>;
  findConfirmedAppointments(): Promise<IAppointment[]>;
  findCancelledAppointments(): Promise<IAppointment[]>;
  findCompletedAppointments(): Promise<IAppointment[]>;
  
  // Appointment lifecycle
  confirmAppointment(appointmentId: string | Types.ObjectId, confirmedBy: string | Types.ObjectId): Promise<boolean>;
  cancelAppointment(appointmentId: string | Types.ObjectId, cancelledBy: string | Types.ObjectId, reason?: string): Promise<boolean>;
  rescheduleAppointment(appointmentId: string | Types.ObjectId, newSlotId: string | Types.ObjectId, rescheduledBy: string | Types.ObjectId): Promise<boolean>;
  markAsCompleted(appointmentId: string | Types.ObjectId, completedBy: string | Types.ObjectId): Promise<boolean>;
  markAsNoShow(appointmentId: string | Types.ObjectId, markedBy: string | Types.ObjectId): Promise<boolean>;
  
  // Provider and facility queries
  findByLabId(labId: string | Types.ObjectId): Promise<IAppointment[]>;
  findByCollectionCenterId(collectionCenterId: string | Types.ObjectId): Promise<IAppointment[]>;
  findByDoctorId(doctorId: string | Types.ObjectId): Promise<IAppointment[]>;
  
  // Date and time-based queries
  findByDate(date: Date): Promise<IAppointment[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IAppointment[]>;
  findTodaysAppointments(): Promise<IAppointment[]>;
  findTomorrowsAppointments(): Promise<IAppointment[]>;
  findUpcomingAppointments(days: number): Promise<IAppointment[]>;
  findOverdueAppointments(): Promise<IAppointment[]>;
  
  // Slot management
  findBySlotId(slotId: string | Types.ObjectId): Promise<IAppointment[]>;
  findAvailableSlots(date: Date, labId?: string | Types.ObjectId, serviceType?: string): Promise<any[]>;
  checkSlotAvailability(slotId: string | Types.ObjectId): Promise<boolean>;
  bookSlot(slotId: string | Types.ObjectId, appointmentData: Partial<IAppointment>): Promise<IAppointment>;
  releaseSlot(slotId: string | Types.ObjectId): Promise<boolean>;
  
  // Reminders and notifications
  findAppointmentsForReminders(hours: number): Promise<IAppointment[]>;
  markReminderSent(appointmentId: string | Types.ObjectId, reminderType: string): Promise<boolean>;
  
  // Search and filtering
  searchAppointments(query: {
    searchTerm?: string;
    status?: string;
    patientId?: string | Types.ObjectId;
    labId?: string | Types.ObjectId;
    doctorId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
    serviceType?: string;
    appointmentType?: string;
  }): Promise<IAppointment[]>;
  
  // Analytics and reporting
  getAppointmentStats(filter?: {
    labId?: string | Types.ObjectId;
    dateRange?: { start: Date; end: Date };
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    averageWaitTime: number;
    noShowRate: number;
    cancellationRate: number;
    utilizationRate: number;
    byTimeSlot: Record<string, number>;
    byServiceType: Record<string, number>;
  }>;
  
  // Capacity and utilization
  getSlotUtilization(labId: string | Types.ObjectId, date: Date): Promise<{
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    utilizationPercentage: number;
  }>;
  
  getDailyCapacity(labId: string | Types.ObjectId, date: Date): Promise<{
    maxAppointments: number;
    scheduledAppointments: number;
    availableCapacity: number;
  }>;
  
  // Wait list management
  addToWaitList(appointmentData: Partial<IAppointment>, preferredDates: Date[]): Promise<IAppointment>;
  findWaitListAppointments(): Promise<IAppointment[]>;
  notifyWaitListForCancellation(slotId: string | Types.ObjectId): Promise<IAppointment[]>;
  
  // Bulk operations
  bulkConfirmAppointments(appointmentIds: (string | Types.ObjectId)[], confirmedBy: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  bulkCancelAppointments(appointmentIds: (string | Types.ObjectId)[], cancelledBy: string | Types.ObjectId, reason: string): Promise<{ modifiedCount: number }>;
  bulkReschedule(appointments: Array<{ appointmentId: string | Types.ObjectId; newSlotId: string | Types.ObjectId }>, rescheduledBy: string | Types.ObjectId): Promise<{ modifiedCount: number }>;
  
  // Follow-up and continuity
  findFollowUpAppointments(originalAppointmentId: string | Types.ObjectId): Promise<IAppointment[]>;
  createFollowUpAppointment(originalAppointmentId: string | Types.ObjectId, followUpData: Partial<IAppointment>): Promise<IAppointment>;
  
  // Resource optimization
  findOptimalSlots(requirements: {
    duration: number;
    preferredTimes: string[];
    labId?: string | Types.ObjectId;
    serviceType?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any[]>;
  
  // Compliance and audit
  getAppointmentHistory(patientId: string | Types.ObjectId): Promise<IAppointment[]>;
  findModifiedAppointments(dateRange: { start: Date; end: Date }): Promise<IAppointment[]>;
}