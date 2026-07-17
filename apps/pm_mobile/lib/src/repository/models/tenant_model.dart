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
  @JsonKey(name: 'last_name')
  final String lastName;
  final String? email;
  final String phone;
  @JsonKey(name: 'profile_photo_url')
  final String? profilePhotoUrl;
  @JsonKey(name: 'recent_lease')
  final TenantLeaseRef? recentLease;

  TenantModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    required this.phone,
    this.profilePhotoUrl,
    this.recentLease,
  });

  String get fullName => '$firstName $lastName';

  factory TenantModel.fromJson(Map<String, dynamic> json) =>
      _$TenantModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantModelToJson(this);
}
