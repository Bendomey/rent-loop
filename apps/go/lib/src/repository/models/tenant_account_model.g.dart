// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_account_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TenantModel _$TenantModelFromJson(Map<String, dynamic> json) => TenantModel(
  id: json['id'] as String,
  firstName: json['first_name'] as String,
  lastName: json['last_name'] as String,
  otherNames: json['other_names'] as String?,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  dateOfBirth: json['date_of_birth'] as String?,
  gender: json['gender'] as String?,
  nationality: json['nationality'] as String?,
  maritalStatus: json['marital_status'] as String?,
  occupation: json['occupation'] as String?,
  occupationAddress: json['occupation_address'] as String?,
  employer: json['employer'] as String?,
  idType: json['id_type'] as String?,
  idNumber: json['id_number'] as String?,
  idFrontUrl: json['id_front_url'] as String?,
  idBackUrl: json['id_back_url'] as String?,
  profilePhotoUrl: json['profile_photo_url'] as String?,
  proofOfIncomeUrl: json['proof_of_income_url'] as String?,
  emergencyContactName: json['emergency_contact_name'] as String?,
  emergencyContactPhone: json['emergency_contact_phone'] as String?,
  relationshipToEmergencyContact:
      json['relationship_to_emergency_contact'] as String?,
);

Map<String, dynamic> _$TenantModelToJson(
  TenantModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'first_name': instance.firstName,
  'last_name': instance.lastName,
  'other_names': instance.otherNames,
  'email': instance.email,
  'phone': instance.phone,
  'date_of_birth': instance.dateOfBirth,
  'gender': instance.gender,
  'nationality': instance.nationality,
  'marital_status': instance.maritalStatus,
  'occupation': instance.occupation,
  'occupation_address': instance.occupationAddress,
  'employer': instance.employer,
  'id_type': instance.idType,
  'id_number': instance.idNumber,
  'id_front_url': instance.idFrontUrl,
  'id_back_url': instance.idBackUrl,
  'profile_photo_url': instance.profilePhotoUrl,
  'proof_of_income_url': instance.proofOfIncomeUrl,
  'emergency_contact_name': instance.emergencyContactName,
  'emergency_contact_phone': instance.emergencyContactPhone,
  'relationship_to_emergency_contact': instance.relationshipToEmergencyContact,
};

TenantAccountModel _$TenantAccountModelFromJson(Map<String, dynamic> json) =>
    TenantAccountModel(
      id: json['id'] as String,
      phoneNumber: json['phone_number'] as String,
      tenantId: json['tenant_id'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      tenant: json['tenant'] == null
          ? null
          : TenantModel.fromJson(json['tenant'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$TenantAccountModelToJson(TenantAccountModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'phone_number': instance.phoneNumber,
      'tenant_id': instance.tenantId,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
      'tenant': instance.tenant,
    };
