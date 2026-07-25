import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'lease_model.g.dart';

/// A single rental agreement — `unit`/`tenant` reuse the existing
/// `UnitModel`/`TenantModel` types directly rather than duplicating them,
/// since the backend builds both nested objects with the exact same
/// transforms already used elsewhere (`DBAdminUnitToRest`,
/// `DBAdminTenantToRest` — the latter has no `recent_lease` key, avoiding a
/// circular reference back to this model).
///
/// Field set is deliberately trimmed to what `DBAdminLeaseToRest`'s map
/// literal (`services/main/internal/transformations/lease.go`) actually
/// emits — notably this excludes the termination-agreement signed-at
/// fields, which are declared on the Go struct (and referenced by the web
/// frontend) but never populated into the map, so they'd always arrive as
/// `null` anyway.
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
  @JsonKey(name: 'tenant_application_id')
  final String? tenantApplicationId;
  @JsonKey(name: 'tenant_application')
  final TenantApplicationModel? tenantApplication;
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
  @JsonKey(name: 'key_handover_date')
  final String? keyHandoverDate;
  @JsonKey(name: 'utility_transfers_date')
  final String? utilityTransfersDate;
  @JsonKey(name: 'property_inspection_date')
  final String? propertyInspectionDate;
  @JsonKey(name: 'lease_agreement_document_url')
  final String? leaseAgreementDocumentUrl;
  @JsonKey(name: 'termination_agreement_document_url')
  final String? terminationAgreementDocumentUrl;
  @JsonKey(name: 'activated_at')
  final String? activatedAt;
  @JsonKey(name: 'cancelled_at')
  final String? cancelledAt;
  @JsonKey(name: 'completed_at')
  final String? completedAt;
  @JsonKey(name: 'terminated_at')
  final String? terminatedAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  LeaseModel({
    required this.id,
    required this.code,
    required this.status,
    required this.unitId,
    this.unit,
    required this.tenantId,
    this.tenant,
    this.tenantApplicationId,
    this.tenantApplication,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.moveInDate,
    this.moveOutDate,
    this.stayDurationFrequency,
    this.stayDuration,
    this.keyHandoverDate,
    this.utilityTransfersDate,
    this.propertyInspectionDate,
    this.leaseAgreementDocumentUrl,
    this.terminationAgreementDocumentUrl,
    this.activatedAt,
    this.cancelledAt,
    this.completedAt,
    this.terminatedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory LeaseModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseModelToJson(this);
}
