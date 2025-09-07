/**
 * Patient Seeder for LabLoop Healthcare System
 * Seeds initial patient data for development and testing
 */

import { Patient } from '../models/Patient.js';
import { User } from '../models/User.js';
import { IPatient, PatientStatus, Gender, BloodGroup } from '@/application/types/index.js';
import { ILogger } from '@/shared/utils/Logger.js';

export interface ISeeder {
  name: string;
  seed(): Promise<void>;
  clear(): Promise<void>;
}

export class PatientSeeder implements ISeeder {
  public readonly name = 'PatientSeeder';
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  async seed(): Promise<void> {
    this.logger.info('Seeding patients...');

    try {
      // Check if patients already exist
      const existingPatientsCount = await Patient.countDocuments();
      if (existingPatientsCount > 0) {
        this.logger.info('Patients already exist, skipping seeding');
        return;
      }

      // Get consumer users to link patients
      const consumerUsers = await User.find({ userType: 'b2c' }).limit(10);
      
      const patients = await this.generatePatients(consumerUsers);
      
      // Insert patients in batches
      const batchSize = 10;
      for (let i = 0; i < patients.length; i += batchSize) {
        const batch = patients.slice(i, i + batchSize);
        await Patient.insertMany(batch, { ordered: false });
        this.logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patients.length / batchSize)}`);
      }

      this.logger.info(`Successfully seeded ${patients.length} patients`);
    } catch (error) {
      this.logger.error('Failed to seed patients', error as Error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    this.logger.info('Clearing patients...');

    try {
      const result = await Patient.deleteMany({});
      this.logger.info(`Cleared ${result.deletedCount} patients`);
    } catch (error) {
      this.logger.error('Failed to clear patients', error as Error);
      throw error;
    }
  }

  private async generatePatients(consumerUsers: any[]): Promise<Partial<IPatient>[]> {
    const patients: Partial<IPatient>[] = [];

    // Sample patient data
    const patientData = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'male' as Gender,
        bloodGroup: 'A+' as BloodGroup,
        mobileNumber: '+919876543301'
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female' as Gender,
        bloodGroup: 'B+' as BloodGroup,
        mobileNumber: '+919876543302'
      },
      {
        firstName: 'Amit',
        lastName: 'Singh',
        dateOfBirth: new Date('1978-12-05'),
        gender: 'male' as Gender,
        bloodGroup: 'O+' as BloodGroup,
        mobileNumber: '+919876543303'
      },
      {
        firstName: 'Sunita',
        lastName: 'Agarwal',
        dateOfBirth: new Date('1982-09-18'),
        gender: 'female' as Gender,
        bloodGroup: 'AB+' as BloodGroup,
        mobileNumber: '+919876543304'
      },
      {
        firstName: 'Vikram',
        lastName: 'Patel',
        dateOfBirth: new Date('1975-05-30'),
        gender: 'male' as Gender,
        bloodGroup: 'A-' as BloodGroup,
        mobileNumber: '+919876543305'
      },
      {
        firstName: 'Kavya',
        lastName: 'Reddy',
        dateOfBirth: new Date('1995-11-12'),
        gender: 'female' as Gender,
        bloodGroup: 'B-' as BloodGroup,
        mobileNumber: '+919876543306'
      },
      {
        firstName: 'Arjun',
        lastName: 'Nair',
        dateOfBirth: new Date('1988-04-08'),
        gender: 'male' as Gender,
        bloodGroup: 'O-' as BloodGroup,
        mobileNumber: '+919876543307'
      },
      {
        firstName: 'Deepika',
        lastName: 'Joshi',
        dateOfBirth: new Date('1992-01-25'),
        gender: 'female' as Gender,
        bloodGroup: 'AB-' as BloodGroup,
        mobileNumber: '+919876543308'
      },
      {
        firstName: 'Rohit',
        lastName: 'Gupta',
        dateOfBirth: new Date('1980-08-14'),
        gender: 'male' as Gender,
        bloodGroup: 'A+' as BloodGroup,
        mobileNumber: '+919876543309'
      },
      {
        firstName: 'Neha',
        lastName: 'Malhotra',
        dateOfBirth: new Date('1987-06-03'),
        gender: 'female' as Gender,
        bloodGroup: 'B+' as BloodGroup,
        mobileNumber: '+919876543310'
      }
    ];

    // Generate additional patients
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
    const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Maharashtra', 'Gujarat'];

    for (let i = 0; i < patientData.length; i++) {
      const data = patientData[i];
      const city = cities[i % cities.length];
      const state = states[i % states.length];
      const consumerUser = consumerUsers[i % consumerUsers.length];

      patients.push({
        patientId: await this.generatePatientId(),
        mrn: `MRN${String(i + 1).padStart(6, '0')}`,
        primaryUserId: consumerUser?._id,
        demographics: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          bloodGroup: data.bloodGroup,
        },
        contact: {
          mobileNumber: data.mobileNumber,
          alternateNumber: i % 3 === 0 ? `+919876543${400 + i}` : undefined,
          email: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@email.com`,
          address: {
            street: `${i + 1}23, Sample Street, Area ${i + 1}`,
            city,
            state,
            zipCode: `${400000 + i}`,
            country: 'India',
          },
        },
        medicalHistory: {
          allergies: this.getRandomAllergies(i),
          medications: this.getRandomMedications(i),
          conditions: this.getRandomConditions(i),
          surgeries: i % 4 === 0 ? ['Appendectomy'] : [],
        },
        insurance: this.getRandomInsurance(i),
        referralChain: [],
        consent: {
          dataSharing: i % 2 === 0,
          researchParticipation: i % 3 === 0,
          marketingCommunication: false,
          familyAccessConsent: true,
          consentDate: new Date(),
        },
        statistics: {
          totalCases: Math.floor(Math.random() * 5),
          totalReports: Math.floor(Math.random() * 10),
          lastVisit: i % 2 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
        },
        status: 'active' as PatientStatus,
        metadata: {
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
    }

    // Generate some pediatric patients
    for (let i = 0; i < 5; i++) {
      const birthYear = new Date().getFullYear() - Math.floor(Math.random() * 17) - 1; // 1-17 years old
      const familyManager = consumerUsers.find(user => user.role === 'familyManager');

      patients.push({
        patientId: await this.generatePatientId(),
        primaryUserId: familyManager?._id,
        demographics: {
          firstName: `Child${i + 1}`,
          lastName: 'Family',
          dateOfBirth: new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: i % 2 === 0 ? 'male' : 'female',
          bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i],
        },
        contact: {
          mobileNumber: `+919876543${320 + i}`,
          address: {
            street: 'Family Address',
            city: 'Pune',
            state: 'Maharashtra',
            zipCode: '411001',
            country: 'India',
          },
        },
        medicalHistory: {
          allergies: i === 0 ? ['Milk'] : [],
        },
        consent: {
          dataSharing: false,
          researchParticipation: false,
          marketingCommunication: false,
          familyAccessConsent: true,
          consentDate: new Date(),
        },
        statistics: {
          totalCases: Math.floor(Math.random() * 3),
          totalReports: Math.floor(Math.random() * 5),
        },
        status: 'active' as PatientStatus,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return patients;
  }

  private async generatePatientId(): Promise<string> {
    let patientId: string;
    let exists: boolean;

    do {
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      patientId = `PAT${timestamp}${random}`;
      exists = await Patient.exists({ patientId });
    } while (exists);

    return patientId;
  }

  private getRandomAllergies(index: number): string[] {
    const allergies = ['Peanuts', 'Shellfish', 'Dust', 'Pollen', 'Latex', 'Penicillin', 'Eggs', 'Milk'];
    if (index % 3 === 0) {
      return [allergies[index % allergies.length]];
    }
    if (index % 5 === 0) {
      return [allergies[index % allergies.length], allergies[(index + 1) % allergies.length]];
    }
    return [];
  }

  private getRandomMedications(index: number): string[] {
    const medications = ['Metformin', 'Lisinopril', 'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Levothyroxine'];
    if (index % 4 === 0) {
      return [medications[index % medications.length]];
    }
    return [];
  }

  private getRandomConditions(index: number): string[] {
    const conditions = ['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Depression', 'Anxiety'];
    if (index % 6 === 0) {
      return [conditions[index % conditions.length]];
    }
    return [];
  }

  private getRandomInsurance(index: number): any {
    if (index % 3 === 0) {
      return {
        provider: ['HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'Star Health'][index % 4],
        policyNumber: `POL${String(index + 1000).padStart(6, '0')}`,
        groupNumber: `GRP${index + 100}`,
        validUntil: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      };
    }
    return undefined;
  }
}