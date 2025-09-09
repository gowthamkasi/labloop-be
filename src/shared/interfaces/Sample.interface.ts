export interface SampleCollectionLocation {
  facilityId?: string;
  facilityType?: 'hospital' | 'lab' | 'collectionCenter' | 'clinic';
  facilityName?: string;
}

export interface SampleCollection {
  collectedAt: Date;
  collectedBy: string;
  collectionLocation: SampleCollectionLocation;
  method?: 'venipuncture' | 'fingerstick' | 'midstream' | 'swab' | 'other';
  volume?: string;
  containerType?: string;
}

export interface SampleProcessing {
  receivedAt?: Date;
  receivedBy?: string;
  processedAt?: Date;
  processedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface SampleStorage {
  location?: string;
  temperature?: string;
  expiryDate?: Date;
}

export interface SampleQualityControl {
  haemolysis: boolean;
  lipemia: boolean;
  icterus: boolean;
  clotted: boolean;
  insufficient: boolean;
}

export interface Sample {
  _id: string;
  sampleId: string; // SMP00000001 format
  barcode?: string;
  caseId: string;
  patientId: string;
  testIds: string[];
  sampleType: 'blood' | 'urine' | 'stool' | 'saliva' | 'tissue' | 'swab' | 'other';
  collectionInfo: SampleCollection;
  processing: SampleProcessing;
  storage: SampleStorage;
  status: 'collected' | 'intransit' | 'received' | 'processing' | 'completed' | 'rejected' | 'expired';
  priority: 'routine' | 'urgent' | 'stat';
  chainOfCustodyCount: number;
  qualityControl: SampleQualityControl;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleChainOfCustody {
  _id: string;
  sampleId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  location?: string;
  temperature?: string;
  notes?: string;
  signature?: string;
  createdAt: Date;
}