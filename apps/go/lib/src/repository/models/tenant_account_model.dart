import 'package:json_annotation/json_annotation.dart';

part 'tenant_account_model.g.dart';

@JsonSerializable()
class TenantModel {
  final String id;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'last_name')
  final String lastName;
  @JsonKey(name: 'other_names')
  final String? otherNames;
  final String? email;
  final String? phone;
  @JsonKey(name: 'date_of_birth')
  final String? dateOfBirth;
  final String? gender;
  final String? nationality;
  @JsonKey(name: 'marital_status')
  final String? maritalStatus;
  final String? occupation;
  @JsonKey(name: 'occupation_address')
  final String? occupationAddress;
  final String? employer;
  @JsonKey(name: 'id_type')
  final String? idType;
  @JsonKey(name: 'id_number')
  final String? idNumber;
  @JsonKey(name: 'id_front_url')
  final String? idFrontUrl;
  @JsonKey(name: 'id_back_url')
  final String? idBackUrl;
  @JsonKey(name: 'profile_photo_url')
  final String? profilePhotoUrl;
  @JsonKey(name: 'proof_of_income_url')
  final String? proofOfIncomeUrl;
  @JsonKey(name: 'emergency_contact_name')
  final String? emergencyContactName;
  @JsonKey(name: 'emergency_contact_phone')
  final String? emergencyContactPhone;
  @JsonKey(name: 'relationship_to_emergency_contact')
  final String? relationshipToEmergencyContact;

  TenantModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.otherNames,
    this.email,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.nationality,
    this.maritalStatus,
    this.occupation,
    this.occupationAddress,
    this.employer,
    this.idType,
    this.idNumber,
    this.idFrontUrl,
    this.idBackUrl,
    this.profilePhotoUrl,
    this.proofOfIncomeUrl,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.relationshipToEmergencyContact,
  });

  factory TenantModel.fromJson(Map<String, dynamic> json) =>
      _$TenantModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantModelToJson(this);
}

@JsonSerializable()
class TenantAccountModel {
  final String id;
  @JsonKey(name: 'phone_number')
  final String phoneNumber;
  @JsonKey(name: 'tenant_id')
  final String? tenantId;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;
  final TenantModel? tenant;

  TenantAccountModel({
    required this.id,
    required this.phoneNumber,
    this.tenantId,
    this.createdAt,
    this.updatedAt,
    this.tenant,
  });

  factory TenantAccountModel.fromJson(Map<String, dynamic> json) =>
      _$TenantAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantAccountModelToJson(this);
}
