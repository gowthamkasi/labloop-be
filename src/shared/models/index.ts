// Model exports
export { UserModel } from './User.model.js';
export { DeviceModel } from './Device.model.js';
export { PatientModel } from './Patient.model.js';
export { HospitalModel } from './Hospital.model.js';
export { LabModel } from './Lab.model.js';
export { DoctorModel } from './Doctor.model.js';
export { OrganizationModel } from './Organization.model.js';
export { CaseModel } from './Case.model.js';
export { SampleModel, SampleChainOfCustodyModel } from './Sample.model.js';
export { ReportModel, ReportTestResultModel } from './Report.model.js';
export { InvoiceModel } from './Invoice.model.js';
export { AppointmentModel } from './Appointment.model.js';
export { TestModel } from './Test.model.js';
export { ClinicModel } from './Clinic.model.js';
export { CollectionCenterModel } from './CollectionCenter.model.js';

// New Models - Tier 1: Core Business Models
export { DoctorFacilityAssociationModel } from './DoctorFacilityAssociations.model.js';
export { FacilityRelationshipModel } from './FacilityRelationships.model.js';
export { OrganizationDoctorModel } from './OrganizationDoctors.model.js';
export { LabTestPriceModel } from './LabTestPrices.model.js';

// New Models - Tier 2: Extended Functionality Models
export { AppointmentTestModel } from './AppointmentTests.model.js';
export { TestSectionModel } from './TestSections.model.js';
export { CaseAttachmentModel } from './CaseAttachments.model.js';
export { AppointmentSlotsModel } from './AppointmentSlots.model.js';

// New Models - Tier 3: Supporting Features Models
export { OrganizationReviewModel } from './OrganizationReviews.model.js';
export { FacilityCertificationModel } from './FacilityCertifications.model.js';
export { FacilityGalleryModel } from './FacilityGallery.model.js';
export { SlotSpecialOfferModel } from './SlotSpecialOffers.model.js';

// MongoDB Document types
export type { UserMongoDoc } from './User.model.js';
export type { DeviceMongoDoc } from './Device.model.js';
export type { PatientMongoDoc } from './Patient.model.js';
export type { HospitalMongoDoc } from './Hospital.model.js';
export type { LabMongoDoc } from './Lab.model.js';
export type { DoctorMongoDoc } from './Doctor.model.js';
export type { OrganizationMongoDoc } from './Organization.model.js';
export type { CaseMongoDoc } from './Case.model.js';
export type { SampleMongoDoc, SampleChainOfCustodyMongoDoc } from './Sample.model.js';
export type { ReportMongoDoc, ReportTestResultMongoDoc } from './Report.model.js';
export type { InvoiceMongoDoc } from './Invoice.model.js';
export type { AppointmentMongoDoc } from './Appointment.model.js';
export type { TestMongoDoc } from './Test.model.js';
export type { ClinicMongoDoc } from './Clinic.model.js';
export type { CollectionCenterMongoDoc } from './CollectionCenter.model.js';

// New Model Document types
export type { DoctorFacilityAssociationMongoDoc } from './DoctorFacilityAssociations.model.js';
export type { FacilityRelationshipMongoDoc } from './FacilityRelationships.model.js';
export type { OrganizationDoctorMongoDoc } from './OrganizationDoctors.model.js';
export type { LabTestPriceMongoDoc } from './LabTestPrices.model.js';
export type { AppointmentTestMongoDoc } from './AppointmentTests.model.js';
export type { TestSectionMongoDoc } from './TestSections.model.js';
export type { CaseAttachmentMongoDoc } from './CaseAttachments.model.js';
export type { AppointmentSlotsMongoDoc } from './AppointmentSlots.model.js';
export type { OrganizationReviewMongoDoc } from './OrganizationReviews.model.js';
export type { FacilityCertificationMongoDoc } from './FacilityCertifications.model.js';
export type { FacilityGalleryMongoDoc } from './FacilityGallery.model.js';
export type { SlotSpecialOfferMongoDoc } from './SlotSpecialOffers.model.js';

// Interface and type exports
export * from '../interfaces/index.js';
export * from '../types/index.js';