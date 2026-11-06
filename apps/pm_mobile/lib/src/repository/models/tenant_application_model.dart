import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'tenant_application_model.g.dart';

/// Minimal invoice reference nested on a tenant application's
/// `application_payment_invoice`. [status] backs the checklist's "Invoice
/// paid" item; the rest is what the lease detail screen links out to.
@JsonSerializable()
class InvoiceRef {
  final String id;
  final String code;
  final String? status;

  InvoiceRef({required this.id, required this.code, this.status});

  factory InvoiceRef.fromJson(Map<String, dynamic> json) =>
      _$InvoiceRefFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceRefToJson(this);

  bool get isPaid => status == 'PAID';
}

/// The lease agreement document attached to an application. Only [content] is
/// read — the checklist parses witness slots out of it.
@JsonSerializable()
class ApplicationDocumentModel {
  final String id;
  final String? content;

  ApplicationDocumentModel({required this.id, this.content});

  factory ApplicationDocumentModel.fromJson(Map<String, dynamic> json) =>
      _$ApplicationDocumentModelFromJson(json);

  Map<String, dynamic> toJson() => _$ApplicationDocumentModelToJson(this);
}

/// One signature row on a lease agreement document. Mirrors
/// `OutputDocumentSignature` — note there is no `label`: witness labels live
/// in the document's content, not on the signature.
@JsonSerializable()
class ApplicationDocumentSignatureModel {
  final String id;
  @JsonKey(name: 'document_id')
  final String? documentId;
  final String? role;
  @JsonKey(name: 'signed_by_name')
  final String? signedByName;
  @JsonKey(name: 'signature_url')
  final String? signatureUrl;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;

  ApplicationDocumentSignatureModel({
    required this.id,
    this.documentId,
    this.role,
    this.signedByName,
    this.signatureUrl,
    this.createdAt,
  });

  factory ApplicationDocumentSignatureModel.fromJson(
    Map<String, dynamic> json,
  ) => _$ApplicationDocumentSignatureModelFromJson(json);

  Map<String, dynamic> toJson() =>
      _$ApplicationDocumentSignatureModelToJson(this);
}

@JsonSerializable()
class FinancialAccountSummaryModel {
  final String? id;
  final String? currency;
  @JsonKey(name: 'total_charged')
  final int? totalCharged;
  @JsonKey(name: 'total_settled')
  final int? totalSettled;
  @JsonKey(name: 'outstanding_amount')
  final int? outstandingAmount;
  @JsonKey(name: 'charge_count')
  final int? chargeCount;
  @JsonKey(name: 'invoice_count')
  final int? invoiceCount;
  @JsonKey(name: 'rent_terms_locked')
  final bool? rentTermsLocked;

  FinancialAccountSummaryModel({
    this.id,
    this.currency,
    this.totalCharged,
    this.totalSettled,
    this.outstandingAmount,
    this.chargeCount,
    this.invoiceCount,
    this.rentTermsLocked,
  });

  factory FinancialAccountSummaryModel.fromJson(Map<String, dynamic> json) =>
      _$FinancialAccountSummaryModelFromJson(json);

  Map<String, dynamic> toJson() => _$FinancialAccountSummaryModelToJson(this);
}

/// A tenant (lease) application. Used two ways, both fed by the same
/// `DBAdminTenantApplicationToRest` transform: nested on a lease (where only
/// the financial-terms fields are populated) and as a row of the applications
/// list (where everything below is). Every field but [id]/[code] is nullable
/// for that reason.
@JsonSerializable()
class TenantApplicationModel {
  final String id;
  final String code;
  final String? status;
  final String? source;

  // Applicant
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'other_names')
  final String? otherNames;
  @JsonKey(name: 'last_name')
  final String? lastName;
  final String? email;
  final String? phone;
  final String? gender;
  @JsonKey(name: 'date_of_birth')
  final DateTime? dateOfBirth;
  final String? nationality;
  @JsonKey(name: 'marital_status')
  final String? maritalStatus;
  @JsonKey(name: 'profile_photo_url')
  final String? profilePhotoUrl;

  // Identity
  @JsonKey(name: 'id_front_url')
  final String? idFrontUrl;
  @JsonKey(name: 'id_back_url')
  final String? idBackUrl;
  @JsonKey(name: 'proof_of_income_url')
  final String? proofOfIncomeUrl;
  @JsonKey(name: 'id_type')
  final String? idType;
  @JsonKey(name: 'id_number')
  final String? idNumber;
  @JsonKey(name: 'current_address')
  final String? currentAddress;

  // Emergency contact + employment
  @JsonKey(name: 'emergency_contact_name')
  final String? emergencyContactName;
  @JsonKey(name: 'emergency_contact_phone')
  final String? emergencyContactPhone;
  @JsonKey(name: 'relationship_to_emergency_contact')
  final String? relationshipToEmergencyContact;
  @JsonKey(name: 'employer_type')
  final String? employerType;
  final String? occupation;
  final String? employer;
  @JsonKey(name: 'occupation_address')
  final String? occupationAddress;

  // Desired unit
  @JsonKey(name: 'desired_unit_id')
  final String? desiredUnitId;
  @JsonKey(name: 'desired_unit')
  final UnitModel? desiredUnit;
  @JsonKey(name: 'property_id')
  final String? apiPropertyId;

  // Move-in
  @JsonKey(name: 'desired_move_in_date')
  final DateTime? desiredMoveInDate;
  @JsonKey(name: 'stay_duration')
  final int? stayDuration;
  @JsonKey(name: 'stay_duration_frequency')
  final String? stayDurationFrequency;

  // Financial
  @JsonKey(name: 'rent_fee')
  final int? rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String? rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'initial_deposit_fee')
  final int? initialDepositFee;
  @JsonKey(name: 'security_deposit_fee')
  final int? securityDepositFee;
  @JsonKey(name: 'application_payment_invoice')
  final InvoiceRef? applicationPaymentInvoice;

  // Lease agreement document
  @JsonKey(name: 'lease_agreement_document_mode')
  final String? leaseAgreementDocumentMode;
  @JsonKey(name: 'lease_agreement_document_url')
  final String? leaseAgreementDocumentUrl;
  @JsonKey(name: 'lease_agreement_document_id')
  final String? leaseAgreementDocumentId;
  @JsonKey(name: 'lease_agreement_document_status')
  final String? leaseAgreementDocumentStatus;
  @JsonKey(name: 'lease_agreement_document')
  final ApplicationDocumentModel? leaseAgreementDocument;
  @JsonKey(name: 'lease_agreement_document_signatures')
  final List<ApplicationDocumentSignatureModel>?
  leaseAgreementDocumentSignatures;

  @JsonKey(name: 'financial_account')
  final FinancialAccountSummaryModel? financialAccount;

  @JsonKey(name: 'cancelled_at')
  final DateTime? cancelledAt;
  @JsonKey(name: 'completed_at')
  final DateTime? completedAt;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;

  TenantApplicationModel({
    required this.id,
    required this.code,
    this.status,
    this.source,
    this.firstName,
    this.otherNames,
    this.lastName,
    this.email,
    this.phone,
    this.gender,
    this.dateOfBirth,
    this.nationality,
    this.maritalStatus,
    this.profilePhotoUrl,
    this.idFrontUrl,
    this.idBackUrl,
    this.proofOfIncomeUrl,
    this.idType,
    this.idNumber,
    this.currentAddress,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.relationshipToEmergencyContact,
    this.employerType,
    this.occupation,
    this.employer,
    this.occupationAddress,
    this.desiredUnitId,
    this.desiredUnit,
    this.apiPropertyId,
    this.desiredMoveInDate,
    this.stayDuration,
    this.stayDurationFrequency,
    this.rentFee,
    this.rentFeeCurrency,
    this.paymentFrequency,
    this.initialDepositFee,
    this.securityDepositFee,
    this.applicationPaymentInvoice,
    this.leaseAgreementDocumentMode,
    this.leaseAgreementDocumentUrl,
    this.leaseAgreementDocumentId,
    this.leaseAgreementDocumentStatus,
    this.leaseAgreementDocument,
    this.leaseAgreementDocumentSignatures,
    this.financialAccount,
    this.cancelledAt,
    this.completedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory TenantApplicationModel.fromJson(Map<String, dynamic> json) =>
      _$TenantApplicationModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantApplicationModelToJson(this);

  String? get propertyId => apiPropertyId ?? desiredUnit?.propertyId;

  String get fullName => [
    firstName,
    otherNames,
    lastName,
  ].whereType<String>().where((s) => s.isNotEmpty).join(' ');
}

class CreateTenantApplicationInput {
  CreateTenantApplicationInput({
    required this.desiredUnitId,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.gender,
    this.otherNames,
    this.email,
    this.dateOfBirth,
    this.nationality,
    this.maritalStatus,
    this.idType,
    this.idNumber,
    this.idFrontUrl,
    this.idBackUrl,
    this.currentAddress,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.relationshipToEmergencyContact,
    this.occupation,
    this.employer,
    this.employerType,
    this.proofOfIncomeUrl,
    this.occupationAddress,
    this.profilePhotoUrl,
  });

  final String desiredUnitId;
  final String firstName;
  final String lastName;
  final String phone;
  final String gender;
  final String? otherNames;
  final String? email;
  final DateTime? dateOfBirth;
  final String? nationality;
  final String? maritalStatus;
  final String? idType;
  final String? idNumber;
  final String? idFrontUrl;
  final String? idBackUrl;
  final String? currentAddress;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? relationshipToEmergencyContact;
  final String? occupation;
  final String? employer;
  final String? employerType;
  final String? proofOfIncomeUrl;
  final String? occupationAddress;
  final String? profilePhotoUrl;

  Map<String, dynamic> toJson() => {
    'desired_unit_id': desiredUnitId,
    'first_name': firstName,
    'last_name': lastName,
    'phone': phone,
    'gender': gender,
    if (otherNames != null) 'other_names': otherNames,
    if (email != null) 'email': email,
    if (dateOfBirth != null)
      'date_of_birth': dateOfBirth!.toUtc().toIso8601String(),
    if (nationality != null) 'nationality': nationality,
    if (maritalStatus != null) 'marital_status': maritalStatus,
    if (idType != null) 'id_type': idType,
    if (idNumber != null) 'id_number': idNumber,
    if (idFrontUrl != null) 'id_front_url': idFrontUrl,
    if (idBackUrl != null) 'id_back_url': idBackUrl,
    if (currentAddress != null) 'current_address': currentAddress,
    if (emergencyContactName != null)
      'emergency_contact_name': emergencyContactName,
    if (emergencyContactPhone != null)
      'emergency_contact_phone': emergencyContactPhone,
    if (relationshipToEmergencyContact != null)
      'relationship_to_emergency_contact': relationshipToEmergencyContact,
    if (occupation != null) 'occupation': occupation,
    if (employer != null) 'employer': employer,
    if (employerType != null) 'employer_type': employerType,
    if (proofOfIncomeUrl != null) 'proof_of_income_url': proofOfIncomeUrl,
    if (occupationAddress != null) 'occupation_address': occupationAddress,
    if (profilePhotoUrl != null) 'profile_photo_url': profilePhotoUrl,
  };
}

@JsonSerializable()
class TenantLookupModel {
  final String? id;
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'other_names')
  final String? otherNames;
  @JsonKey(name: 'last_name')
  final String? lastName;
  final String? email;
  final String? phone;
  final String? gender;
  @JsonKey(name: 'date_of_birth')
  final DateTime? dateOfBirth;
  final String? nationality;
  @JsonKey(name: 'marital_status')
  final String? maritalStatus;
  @JsonKey(name: 'id_type')
  final String? idType;
  @JsonKey(name: 'id_number')
  final String? idNumber;
  @JsonKey(name: 'id_front_url')
  final String? idFrontUrl;
  @JsonKey(name: 'id_back_url')
  final String? idBackUrl;
  @JsonKey(name: 'current_address')
  final String? currentAddress;
  @JsonKey(name: 'emergency_contact_name')
  final String? emergencyContactName;
  @JsonKey(name: 'emergency_contact_phone')
  final String? emergencyContactPhone;
  @JsonKey(name: 'relationship_to_emergency_contact')
  final String? relationshipToEmergencyContact;
  final String? occupation;
  final String? employer;
  @JsonKey(name: 'occupation_address')
  final String? occupationAddress;
  @JsonKey(name: 'proof_of_income_url')
  final String? proofOfIncomeUrl;
  @JsonKey(name: 'profile_photo_url')
  final String? profilePhotoUrl;

  TenantLookupModel({
    this.id,
    this.firstName,
    this.otherNames,
    this.lastName,
    this.email,
    this.phone,
    this.gender,
    this.dateOfBirth,
    this.nationality,
    this.maritalStatus,
    this.idType,
    this.idNumber,
    this.idFrontUrl,
    this.idBackUrl,
    this.currentAddress,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.relationshipToEmergencyContact,
    this.occupation,
    this.employer,
    this.occupationAddress,
    this.proofOfIncomeUrl,
    this.profilePhotoUrl,
  });

  factory TenantLookupModel.fromJson(Map<String, dynamic> json) =>
      _$TenantLookupModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantLookupModelToJson(this);
}
