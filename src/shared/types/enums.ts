// User related enums
export enum UserType {
  B2B = 'b2b',
  B2C = 'b2c'
}

export enum UserRole {
  // B2B Roles
  ADMIN = 'admin',
  LAB_MANAGER = 'labManager', 
  TECHNICIAN = 'technician',
  COLLECTION_AGENT = 'collectionAgent',
  RECEPTIONIST = 'receptionist',
  QUALITY_CONTROLLER = 'qualityController',
  LAB_ASSISTANT = 'labAssistant',
  
  // B2C Roles
  CONSUMER = 'consumer',
  FAMILY_MANAGER = 'familyManager'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female', 
  OTHER = 'other'
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'Unknown'
}