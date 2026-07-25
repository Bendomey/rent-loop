import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'tenant_model.g.dart';

/// A tenant's most relevant lease (active preferred, else most recent) —
/// nested on `GET .../tenants` responses. `unit` is the exact same JSON
/// shape as `UnitModel` (backend uses `DBAdminUnitToRest` for both), so it's
/// reused directly rather than duplicated.
@JsonSerializable()
class TenantLeaseRef {
  final String status; // dotted Lease.Status.* value
  final UnitModel? unit;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'move_in_date')
  final String? moveInDate;
  @JsonKey(name: 'move_out_date')
  final String? moveOutDate;

  TenantLeaseRef({
    required this.status,
    this.unit,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.moveInDate,
    this.moveOutDate,
  });

  factory TenantLeaseRef.fromJson(Map<String, dynamic> json) =>
      _$TenantLeaseRefFromJson(json);

  Map<String, dynamic> toJson() => _$TenantLeaseRefToJson(this);
}

@JsonSerializable()
class TenantModel {
  final String id;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'other_names')
  final String? otherNames;
  @JsonKey(name: 'last_name')
  final String lastName;
  final String? email;
  final String phone;
  final String gender;
  @JsonKey(name: 'date_of_birth')
  final String? dateOfBirth;
  final String? nationality;
  @JsonKey(name: 'marital_status')
  final String? maritalStatus;
  @JsonKey(name: 'profile_photo_url')
  final String? profilePhotoUrl;
  @JsonKey(name: 'id_type')
  final String? idType;
  @JsonKey(name: 'id_number')
  final String? idNumber;
  @JsonKey(name: 'id_front_url')
  final String? idFrontUrl;
  @JsonKey(name: 'id_back_url')
  final String? idBackUrl;
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
  @JsonKey(name: 'recent_lease')
  final TenantLeaseRef? recentLease;

  TenantModel({
    required this.id,
    required this.firstName,
    this.otherNames,
    required this.lastName,
    this.email,
    required this.phone,
    required this.gender,
    this.dateOfBirth,
    this.nationality,
    this.maritalStatus,
    this.profilePhotoUrl,
    this.idType,
    this.idNumber,
    this.idFrontUrl,
    this.idBackUrl,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.relationshipToEmergencyContact,
    this.occupation,
    this.employer,
    this.occupationAddress,
    this.proofOfIncomeUrl,
    this.recentLease,
  });

  String get fullName => '$firstName $lastName';

  factory TenantModel.fromJson(Map<String, dynamic> json) =>
      _$TenantModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantModelToJson(this);
}
