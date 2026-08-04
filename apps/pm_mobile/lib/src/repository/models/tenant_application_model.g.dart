// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_application_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceRef _$InvoiceRefFromJson(Map<String, dynamic> json) => InvoiceRef(
  id: json['id'] as String,
  code: json['code'] as String,
  status: json['status'] as String?,
);

Map<String, dynamic> _$InvoiceRefToJson(InvoiceRef instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
    };

ApplicationDocumentModel _$ApplicationDocumentModelFromJson(
  Map<String, dynamic> json,
) => ApplicationDocumentModel(
  id: json['id'] as String,
  content: json['content'] as String?,
);

Map<String, dynamic> _$ApplicationDocumentModelToJson(
  ApplicationDocumentModel instance,
) => <String, dynamic>{'id': instance.id, 'content': instance.content};

ApplicationDocumentSignatureModel _$ApplicationDocumentSignatureModelFromJson(
  Map<String, dynamic> json,
) => ApplicationDocumentSignatureModel(
  id: json['id'] as String,
  documentId: json['document_id'] as String?,
  role: json['role'] as String?,
  signedByName: json['signed_by_name'] as String?,
  signatureUrl: json['signature_url'] as String?,
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
);

Map<String, dynamic> _$ApplicationDocumentSignatureModelToJson(
  ApplicationDocumentSignatureModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'document_id': instance.documentId,
  'role': instance.role,
  'signed_by_name': instance.signedByName,
  'signature_url': instance.signatureUrl,
  'created_at': instance.createdAt?.toIso8601String(),
};

TenantApplicationModel _$TenantApplicationModelFromJson(
  Map<String, dynamic> json,
) => TenantApplicationModel(
  id: json['id'] as String,
  code: json['code'] as String,
  status: json['status'] as String?,
  source: json['source'] as String?,
  firstName: json['first_name'] as String?,
  otherNames: json['other_names'] as String?,
  lastName: json['last_name'] as String?,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  gender: json['gender'] as String?,
  dateOfBirth: json['date_of_birth'] == null
      ? null
      : DateTime.parse(json['date_of_birth'] as String),
  nationality: json['nationality'] as String?,
  maritalStatus: json['marital_status'] as String?,
  profilePhotoUrl: json['profile_photo_url'] as String?,
  idType: json['id_type'] as String?,
  idNumber: json['id_number'] as String?,
  currentAddress: json['current_address'] as String?,
  emergencyContactName: json['emergency_contact_name'] as String?,
  emergencyContactPhone: json['emergency_contact_phone'] as String?,
  relationshipToEmergencyContact:
      json['relationship_to_emergency_contact'] as String?,
  employerType: json['employer_type'] as String?,
  occupation: json['occupation'] as String?,
  employer: json['employer'] as String?,
  occupationAddress: json['occupation_address'] as String?,
  desiredUnitId: json['desired_unit_id'] as String?,
  desiredUnit: json['desired_unit'] == null
      ? null
      : UnitModel.fromJson(json['desired_unit'] as Map<String, dynamic>),
  desiredMoveInDate: json['desired_move_in_date'] == null
      ? null
      : DateTime.parse(json['desired_move_in_date'] as String),
  stayDuration: (json['stay_duration'] as num?)?.toInt(),
  stayDurationFrequency: json['stay_duration_frequency'] as String?,
  rentFee: (json['rent_fee'] as num?)?.toInt(),
  rentFeeCurrency: json['rent_fee_currency'] as String?,
  paymentFrequency: json['payment_frequency'] as String?,
  initialDepositFee: (json['initial_deposit_fee'] as num?)?.toInt(),
  securityDepositFee: (json['security_deposit_fee'] as num?)?.toInt(),
  applicationPaymentInvoice: json['application_payment_invoice'] == null
      ? null
      : InvoiceRef.fromJson(
          json['application_payment_invoice'] as Map<String, dynamic>,
        ),
  leaseAgreementDocumentMode: json['lease_agreement_document_mode'] as String?,
  leaseAgreementDocumentUrl: json['lease_agreement_document_url'] as String?,
  leaseAgreementDocumentId: json['lease_agreement_document_id'] as String?,
  leaseAgreementDocumentStatus:
      json['lease_agreement_document_status'] as String?,
  leaseAgreementDocument: json['lease_agreement_document'] == null
      ? null
      : ApplicationDocumentModel.fromJson(
          json['lease_agreement_document'] as Map<String, dynamic>,
        ),
  leaseAgreementDocumentSignatures:
      (json['lease_agreement_document_signatures'] as List<dynamic>?)
          ?.map(
            (e) => ApplicationDocumentSignatureModel.fromJson(
              e as Map<String, dynamic>,
            ),
          )
          .toList(),
  createdAt: json['created_at'] == null
      ? null
      : DateTime.parse(json['created_at'] as String),
  updatedAt: json['updated_at'] == null
      ? null
      : DateTime.parse(json['updated_at'] as String),
);

Map<String, dynamic> _$TenantApplicationModelToJson(
  TenantApplicationModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'code': instance.code,
  'status': instance.status,
  'source': instance.source,
  'first_name': instance.firstName,
  'other_names': instance.otherNames,
  'last_name': instance.lastName,
  'email': instance.email,
  'phone': instance.phone,
  'gender': instance.gender,
  'date_of_birth': instance.dateOfBirth?.toIso8601String(),
  'nationality': instance.nationality,
  'marital_status': instance.maritalStatus,
  'profile_photo_url': instance.profilePhotoUrl,
  'id_type': instance.idType,
  'id_number': instance.idNumber,
  'current_address': instance.currentAddress,
  'emergency_contact_name': instance.emergencyContactName,
  'emergency_contact_phone': instance.emergencyContactPhone,
  'relationship_to_emergency_contact': instance.relationshipToEmergencyContact,
  'employer_type': instance.employerType,
  'occupation': instance.occupation,
  'employer': instance.employer,
  'occupation_address': instance.occupationAddress,
  'desired_unit_id': instance.desiredUnitId,
  'desired_unit': instance.desiredUnit,
  'desired_move_in_date': instance.desiredMoveInDate?.toIso8601String(),
  'stay_duration': instance.stayDuration,
  'stay_duration_frequency': instance.stayDurationFrequency,
  'rent_fee': instance.rentFee,
  'rent_fee_currency': instance.rentFeeCurrency,
  'payment_frequency': instance.paymentFrequency,
  'initial_deposit_fee': instance.initialDepositFee,
  'security_deposit_fee': instance.securityDepositFee,
  'application_payment_invoice': instance.applicationPaymentInvoice,
  'lease_agreement_document_mode': instance.leaseAgreementDocumentMode,
  'lease_agreement_document_url': instance.leaseAgreementDocumentUrl,
  'lease_agreement_document_id': instance.leaseAgreementDocumentId,
  'lease_agreement_document_status': instance.leaseAgreementDocumentStatus,
  'lease_agreement_document': instance.leaseAgreementDocument,
  'lease_agreement_document_signatures':
      instance.leaseAgreementDocumentSignatures,
  'created_at': instance.createdAt?.toIso8601String(),
  'updated_at': instance.updatedAt?.toIso8601String(),
};
