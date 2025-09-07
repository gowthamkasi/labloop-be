/**
 * Migration: Create indexes for Priority 2 models
 * Creates optimized indexes for Hospital, Lab, Test, Case, Sample, Report, Invoice, and Appointment models
 * Based on the schema specifications from optimized_schema_backup.json
 */

import { Connection } from 'mongoose';

export const migration002CreatePriority2Indexes = async (connection: Connection): Promise<void> => {
  console.log('🔄 Running migration 002: Create Priority 2 model indexes...');

  try {
    // Hospital indexes
    console.log('  📊 Creating Hospital indexes...');
    const hospitalCollection = connection.collection('hospitals');
    await hospitalCollection.createIndexes([
      { key: { hospitalId: 1 }, unique: true },
      { key: { licenseNumber: 1 }, unique: true },
      { key: { hospitalType: 1, 'status.isActive': 1 } },
      { key: { 'status.isActive': 1, 'status.isVerified': 1 } },
      { key: { attachedLabs: 1 }, sparse: true },
      { key: { 'address.city': 1, 'address.state': 1 } },
      { key: { 'address.coordinates': '2dsphere' } },
      { key: { 'mobileFields.averageRating': -1, 'mobileFields.reviewCount': -1 } },
      { key: { name: 'text', 'address.city': 'text', 'address.state': 'text', departments: 'text' } },
      { key: { hospitalType: 1, 'address.city': 1, 'status.isActive': 1 } },
      { key: { emergencyServices: 1, 'address.city': 1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Lab indexes
    console.log('  🧪 Creating Lab indexes...');
    const labCollection = connection.collection('labs');
    await labCollection.createIndexes([
      { key: { labId: 1 }, unique: true },
      { key: { licenseNumber: 1 }, unique: true },
      { key: { labType: 1, 'status.isActive': 1 } },
      { key: { ownership: 1, 'status.isActive': 1 } },
      { key: { parentHospital: 1 }, sparse: true },
      { key: { attachedCollectionCenters: 1 }, sparse: true },
      { key: { 'address.city': 1, 'address.state': 1 } },
      { key: { 'address.coordinates': '2dsphere' } },
      { key: { 'capabilities.testCategories': 1 } },
      { key: { 'capabilities.homeCollection': 1 } },
      { key: { 'mobileFields.averageRating': -1, 'mobileFields.reviewCount': -1 } },
      { key: { name: 'text', 'address.city': 'text', 'capabilities.testCategories': 'text' } },
      { key: { nablAccreditationNumber: 1 }, sparse: true },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Test indexes
    console.log('  🔬 Creating Test indexes...');
    const testCollection = connection.collection('tests');
    await testCollection.createIndexes([
      { key: { testId: 1 }, unique: true },
      { key: { testCode: 1 }, unique: true },
      { key: { category: 1, status: 1 } },
      { key: { status: 1, isPopular: -1 } },
      { key: { status: 1, isRoutine: 1 } },
      { key: { complexity: 1, status: 1 } },
      { key: { sampleType: 1 } },
      { key: { 'pricing.basePrice': 1 } },
      { key: { 'pricing.insuranceCovered': 1 } },
      { key: { 'timings.normalReportTime': 1 } },
      { key: { name: 'text', shortName: 'text', description: 'text', testCode: 'text', tags: 'text' } },
      { key: { category: 1, 'pricing.basePrice': 1, status: 1 } },
      { key: { isPopular: -1, isRoutine: -1, status: 1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Case indexes
    console.log('  📋 Creating Case indexes...');
    const caseCollection = connection.collection('cases');
    await caseCollection.createIndexes([
      { key: { caseId: 1 }, unique: true },
      { key: { caseNumber: 1 }, unique: true, sparse: true },
      { key: { status: 1, priority: -1 } },
      { key: { labId: 1, status: 1 } },
      { key: { 'patient.patientId': 1, status: 1 } },
      { key: { hospitalId: 1 }, sparse: true },
      { key: { testIds: 1 } },
      { key: { 'workflow.currentStage': 1 } },
      { key: { 'billing.paymentStatus': 1 } },
      { key: { collectionDate: 1 }, sparse: true },
      { key: { caseId: 'text', 'patient.name': 'text', 'physician.name': 'text' } },
      { key: { labId: 1, status: 1, priority: -1, 'metadata.createdAt': -1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Sample indexes
    console.log('  🧾 Creating Sample indexes...');
    const sampleCollection = connection.collection('samples');
    await sampleCollection.createIndexes([
      { key: { sampleId: 1 }, unique: true },
      { key: { barcode: 1 }, unique: true, sparse: true },
      { key: { status: 1, priority: -1 } },
      { key: { sampleType: 1, status: 1 } },
      { key: { labId: 1, status: 1 } },
      { key: { caseId: 1 } },
      { key: { patientId: 1 } },
      { key: { testIds: 1 } },
      { key: { collectedBy: 1, collectedAt: -1 } },
      { key: { 'quality.integrity': 1 } },
      { key: { 'rejection.isRejected': 1 } },
      { key: { 'chainOfCustody.handledBy': 1 } },
      { key: { sampleId: 'text', barcode: 'text', notes: 'text' } },
      { key: { labId: 1, status: 1, collectedAt: -1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Report indexes
    console.log('  📄 Creating Report indexes...');
    const reportCollection = connection.collection('reports');
    await reportCollection.createIndexes([
      { key: { reportId: 1 }, unique: true },
      { key: { reportNumber: 1 }, unique: true, sparse: true },
      { key: { caseId: 1 } },
      { key: { patientId: 1, generatedAt: -1 } },
      { key: { labId: 1, status: 1 } },
      { key: { status: 1, reportType: 1 } },
      { key: { generatedAt: -1 } },
      { key: { 'approval.approvedAt': -1 }, sparse: true },
      { key: { 'versioning.isLatest': 1 } },
      { key: { isConfidential: 1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Invoice indexes
    console.log('  💰 Creating Invoice indexes...');
    const invoiceCollection = connection.collection('invoices');
    await invoiceCollection.createIndexes([
      { key: { invoiceId: 1 }, unique: true },
      { key: { invoiceNumber: 1 }, unique: true },
      { key: { patientId: 1, issueDate: -1 } },
      { key: { labId: 1, status: 1 } },
      { key: { caseId: 1 }, sparse: true },
      { key: { status: 1, dueDate: 1 } },
      { key: { issueDate: -1 } },
      { key: { 'totals.grandTotal': -1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    // Appointment indexes
    console.log('  📅 Creating Appointment indexes...');
    const appointmentCollection = connection.collection('appointments');
    await appointmentCollection.createIndexes([
      { key: { appointmentId: 1 }, unique: true },
      { key: { appointmentNumber: 1 }, unique: true, sparse: true },
      { key: { patientId: 1, 'slot.startTime': -1 } },
      { key: { labId: 1, status: 1 }, sparse: true },
      { key: { hospitalId: 1, status: 1 }, sparse: true },
      { key: { status: 1, 'slot.startTime': 1 } },
      { key: { appointmentType: 1, status: 1 } },
      { key: { 'slot.startTime': 1, 'slot.endTime': 1 } },
      { key: { assignedStaff: 1, 'slot.startTime': 1 }, sparse: true },
      { key: { priority: -1, 'slot.startTime': 1 } },
      { key: { 'location.locationId': 1, 'slot.startTime': 1 } },
      { key: { appointmentId: 'text', patientName: 'text', patientPhone: 'text' } },
      { key: { 'slot.startTime': 1, status: 1, 'location.locationId': 1 } },
      { key: { 'metadata.deletedAt': 1 }, sparse: true },
    ]);

    console.log('✅ Migration 002 completed successfully!');
    console.log('📊 Created indexes for:');
    console.log('   - Hospitals (14 indexes)');
    console.log('   - Labs (14 indexes)');
    console.log('   - Tests (14 indexes)');
    console.log('   - Cases (12 indexes)');
    console.log('   - Samples (14 indexes)');
    console.log('   - Reports (11 indexes)');
    console.log('   - Invoices (9 indexes)');
    console.log('   - Appointments (14 indexes)');

  } catch (error) {
    console.error('❌ Migration 002 failed:', error);
    throw error;
  }
};

export default migration002CreatePriority2Indexes;