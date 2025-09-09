export interface ReportSummary {
  clinicalImpression?: string;
  recommendations?: string;
  criticalValues: string[];
  followUpRequired: boolean;
}

export interface ReportStatus {
  current: 'draft' | 'pending' | 'partialComplete' | 'complete' | 'verified' | 'released' | 'amended';
  releasedAt?: Date;
  amendedAt?: Date;
  amendmentReason?: string;
}

export interface ReportAuthorization {
  authorizedBy?: string;
  authorizedAt?: Date;
  digitalSignature?: string;
}

export interface ReportDelivery {
  method: 'email' | 'portal' | 'print' | 'api';
  deliveredAt?: Date;
  deliveredTo?: string;
  accessedAt?: Date;
  downloadCount: number;
}

export interface Report {
  _id: string;
  reportId: string; // RPT00000001 format
  caseId: string;
  patientId: string;
  organizationId: string;
  reportType: 'individual' | 'panel' | 'comprehensive';
  testCount: number;
  summary: ReportSummary;
  status: ReportStatus;
  authorization: ReportAuthorization;
  delivery: ReportDelivery;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  version: number;
  previousVersions: string[];
}

export interface TestResult {
  parameterId: string;
  parameterName: string;
  value: string | number | boolean; // Mixed type
  unit?: string;
  normalRange?: string;
  flag?: 'normal' | 'low' | 'high' | 'critical' | 'abnormal';
  notes?: string;
}

export interface ReportTestResult {
  _id: string;
  reportId: string;
  testId: string;
  sampleId?: string;
  testName: string;
  results: TestResult[];
  performedAt?: Date;
  performedBy?: string;
  verifiedBy?: string;
  interpretation?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}