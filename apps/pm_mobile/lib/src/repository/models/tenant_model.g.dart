// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TenantLeaseRef _$TenantLeaseRefFromJson(Map<String, dynamic> json) =>
    TenantLeaseRef(
      status: json['status'] as String,
      unit: json['unit'] == null
          ? null
          : UnitModel.fromJson(json['unit'] as Map<String, dynamic>),
      rentFee: (json['rent_fee'] as num).toInt(),
      rentFeeCurrency: json['rent_fee_currency'] as String,
      paymentFrequency: json['payment_frequency'] as String?,
      moveInDate: json['move_in_date'] as String?,
      moveOutDate: json['move_out_date'] as String?,
    );

Map<String, dynamic> _$TenantLeaseRefToJson(TenantLeaseRef instance) =>
    <String, dynamic>{
      'status': instance.status,
      'unit': instance.unit,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'move_in_date': instance.moveInDate,
      'move_out_date': instance.moveOutDate,
    };

TenantModel _$TenantModelFromJson(Map<String, dynamic> json) => TenantModel(
  id: json['id'] as String,
  firstName: json['first_name'] as String,
  otherNames: json['other_names'] as String?,
  lastName: json['last_name'] as String,
  email: json['email'] as String?,
  phone: json['phone'] as String,
  gender: json['gender'] as String,
  dateOfBirth: json['date_of_birth'] as String?,
  nationality: json['nationality'] as String?,
  maritalStatus: json['marital_status'] as String?,
  profilePhotoUrl: json['profile_photo_url'] as String?,
  idType: json['id_type'] as String?,
  idNumber: json['id_number'] as String?,
  idFrontUrl: json['id_front_url'] as String?,
  idBackUrl: json['id_back_url'] as String?,
  emergencyContactName: json['emergency_contact_name'] as String?,
  emergencyContactPhone: json['emergency_contact_phone'] as String?,
  relationshipToEmergencyContact:
      json['relationship_to_emergency_contact'] as String?,
  occupation: json['occupation'] as String?,
  employer: json['employer'] as String?,
  occupationAddress: json['occupation_address'] as String?,
  proofOfIncomeUrl: json['proof_of_income_url'] as String?,
  recentLease: json['recent_lease'] == null
      ? null
      : TenantLeaseRef.fromJson(json['recent_lease'] as Map<String, dynamic>),
);

Map<String, dynamic> _$TenantModelToJson(
  TenantModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'first_name': instance.firstName,
  'other_names': instance.otherNames,
  'last_name': instance.lastName,
  'email': instance.email,
  'phone': instance.phone,
  'gender': instance.gender,
  'date_of_birth': instance.dateOfBirth,
  'nationality': instance.nationality,
  'marital_status': instance.maritalStatus,
  'profile_photo_url': instance.profilePhotoUrl,
  'id_type': instance.idType,
  'id_number': instance.idNumber,
  'id_front_url': instance.idFrontUrl,
  'id_back_url': instance.idBackUrl,
  'emergency_contact_name': instance.emergencyContactName,
  'emergency_contact_phone': instance.emergencyContactPhone,
  'relationship_to_emergency_contact': instance.relationshipToEmergencyContact,
  'occupation': instance.occupation,
  'employer': instance.employer,
  'occupation_address': instance.occupationAddress,
  'proof_of_income_url': instance.proofOfIncomeUrl,
  'recent_lease': instance.recentLease,
};
