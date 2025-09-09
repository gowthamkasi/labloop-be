export interface AppointmentScheduling {
  scheduledDate: Date;
  scheduledTime: string; // HH:MM format
  duration: number; // minutes
  timeSlotId?: string;
}

export interface AppointmentLocation {
  type: 'onsite' | 'home' | 'virtual';
  address?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface AppointmentServices {
  testIds: string[];
  packageIds: string[];
  testCount: number;
}

export interface AppointmentAssignment {
  collectorId?: string;
  vehicleId?: string;
  routeId?: string;
}

export interface AppointmentStatus {
  current: 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'noShow' | 'rescheduled';
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface AppointmentReminders {
  sent: boolean;
  sentAt?: Date;
  method?: 'sms' | 'email' | 'push' | 'whatsapp';
}

export interface AppointmentFacilitySnapshot {
  name?: string;
  type?: string;
  address?: string;
  phone?: string;
  distance?: number;
}

export interface AppointmentPatientSnapshot {
  name?: string;
  phone?: string;
  age?: number;
  gender?: string;
}

export interface AppointmentCollectorInfo {
  id?: string;
  name?: string;
  phone?: string;
  rating?: number;
}

export interface AppointmentDetails {
  totalCost?: number;
  estimatedDuration?: number;
  specialInstructions?: string;
  homeAddress?: string;
  canReschedule: boolean;
  canCancel: boolean;
}

export interface Appointment {
  _id: string;
  appointmentId: string; // APT000001 format (Note: schema shows 6 digits but following 8-digit pattern)
  patientId: string;
  caseId?: string;
  organizationId: string;
  type: 'walkIn' | 'scheduled' | 'urgent' | 'homeCollection' | 'visitLab' | 'teleconsultation';
  scheduling: AppointmentScheduling;
  location: AppointmentLocation;
  services: AppointmentServices;
  assignment: AppointmentAssignment;
  status: AppointmentStatus;
  reminders: AppointmentReminders;
  notes?: string;
  facilitySnapshot?: AppointmentFacilitySnapshot;
  patientSnapshot?: AppointmentPatientSnapshot;
  collectorInfo?: AppointmentCollectorInfo;
  appointmentDetails: AppointmentDetails;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}