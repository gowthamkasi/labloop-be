export interface CaseReferral {
  type: 'doctor' | 'hospital' | 'selfReferral' | 'corporate';
  referrerId?: string;
  referrerName?: string;
  referralDate: Date;
}

export interface CaseWorkflowStage {
  stage: string;
  status: 'pending' | 'inProgress' | 'completed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface CaseWorkflow {
  currentStage: 'registration' | 'sampleCollection' | 'processing' | 'reporting' | 'delivery';
  stages: CaseWorkflowStage[];
}

export interface CaseTimeline {
  expectedCompletion: Date;
  actualCompletion?: Date;
  slaBreached: boolean;
}

export interface Case {
  _id: string;
  caseId: string; // CASE000001 format
  patientId: string;
  referral: CaseReferral;
  organizationId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sampleCollected' | 'inProgress' | 'completed' | 'cancelled' | 'onHold';
  workflow: CaseWorkflow;
  timeline: CaseTimeline;
  notes?: string;
  attachmentCount: number;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}