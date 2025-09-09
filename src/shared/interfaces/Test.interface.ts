export interface TestSampleRequirement {
  type: 'blood' | 'urine' | 'stool' | 'saliva' | 'tissue' | 'swab';
  volume?: string;
  container?: string;
  storageTemperature?: string;
}

export interface TestSampleRequirements {
  types: TestSampleRequirement[];
  fastingRequired: 'none' | '8hours' | '10hours' | '12hours' | 'overnight';
  specialInstructions?: string;
}

export interface TestParameter {
  name: string;
  displayName?: string;
  unit?: string;
  dataType: 'numeric' | 'text' | 'boolean' | 'option';
  normalRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  criticalRange?: {
    low?: number;
    high?: number;
  };
  options?: string[];
  order: number;
}

export interface TestPricing {
  basePrice: number;
  discountedPrice?: number;
  homeCollectionCharge: number;
  urgentProcessingCharge: number;
}

export interface TestTurnaround {
  standard: number;
  urgent?: number;
  unit: 'hours' | 'days';
}

export interface TestAvailability {
  isActive: boolean;
  isFeatured: boolean;
  isPopular: boolean;
}

export interface TestSampleType {
  type: 'blood' | 'urine' | 'stool' | 'saliva' | 'tissue' | 'swab';
  displayName?: string;
  icon?: string;
}

export interface TestFastingRequirement {
  required: 'none' | '8_hours' | '10_hours' | '12_hours' | 'overnight';
  displayText?: string;
  instructions?: string;
}

export interface TestMobileFields {
  icon: string;
  duration: string;
  reportTime: string;
  keyMeasurements: string[];
  healthBenefits?: string;
  categoryColor?: string;
  formattedPrice?: string;
  formattedOriginalPrice?: string;
}

export interface Test {
  _id: string;
  testId: string; // TST000001 format
  name: string;
  shortName: string;
  category: 'bloodTest' | 'imaging' | 'cardiology' | 'womensHealth' | 'diabetes' | 'thyroid' | 'liver' | 'kidney' | 'cancer' | 'fitness' | 'allergy' | 'infection' | 'general';
  subcategory?: string;
  description: string;
  clinicalSignificance?: string;
  methodology: string;
  sampleRequirements: TestSampleRequirements;
  parameters: TestParameter[];
  pricing: TestPricing;
  turnaround: TestTurnaround;
  availability: TestAvailability;
  searchTags?: string[];
  relatedTests?: string[];
  sampleType: TestSampleType;
  fastingRequirement: TestFastingRequirement;
  mobileFields: TestMobileFields;
  sectionsCount: number;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}