import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'lease_model.g.dart';

/// A single rental agreement — `unit`/`tenant` reuse the existing
/// `UnitModel`/`TenantModel` types directly rather than duplicating them,
/// since the backend builds both nested objects with the exact same
/// transforms already used elsewhere (`DBAdminUnitToRest`,
/// `DBAdminTenantToRest` — the latter has no `recent_lease` key, avoiding a
/// circular reference back to this model).
@JsonSerializable()
class LeaseModel {
  final String id;
  final String code;
  final String status; // dotted Lease.Status.* value
  @JsonKey(name: 'unit_id')
  final String unitId;
  final UnitModel? unit;
  @JsonKey(name: 'tenant_id')
  final String tenantId;
  final TenantModel? tenant;
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
  @JsonKey(name: 'stay_duration_frequency')
  final String? stayDurationFrequency;
  @JsonKey(name: 'stay_duration')
  final int? stayDuration;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  LeaseModel({
    required this.id,
    required this.code,
    required this.status,
    required this.unitId,
    this.unit,
    required this.tenantId,
    this.tenant,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.moveInDate,
    this.moveOutDate,
    this.stayDurationFrequency,
    this.stayDuration,
    this.createdAt,
  });

  factory LeaseModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseModelToJson(this);
}
