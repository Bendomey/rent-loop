import 'package:json_annotation/json_annotation.dart';
import 'tenant_application_model.dart';

part 'lease_model.g.dart';

/// Converts "Lease.Status.Pending" → "Pending", etc.
String leaseStatusLabel(String status) {
  const prefix = 'Lease.Status.';
  if (status.startsWith(prefix)) return status.substring(prefix.length);
  return status;
}

@JsonSerializable()
class LeaseUnitModel {
  final String id;
  final String name;
  final String slug;

  LeaseUnitModel({required this.id, required this.name, required this.slug});

  factory LeaseUnitModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseUnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseUnitModelToJson(this);
}

@JsonSerializable()
class LeaseModel {
  final String id;
  final String code;
  final String status;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'move_in_date')
  final String? moveInDate;
  @JsonKey(name: 'activated_at')
  final String? activatedAt;
  @JsonKey(name: 'stay_duration')
  final int? stayDuration;
  @JsonKey(name: 'stay_duration_frequency')
  final String? stayDurationFrequency;
  @JsonKey(name: 'key_handover_date')
  final String? keyHandoverDate;
  @JsonKey(name: 'property_inspection_date')
  final String? propertyInspectionDate;
  @JsonKey(name: 'lease_agreement_document_url')
  final String? leaseAgreementDocumentUrl;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'unit_id')
  final String unitId;
  final LeaseUnitModel? unit;
  @JsonKey(name: 'tenant_application')
  final TenantApplicationModel? tenantApplication;

  LeaseModel({
    required this.id,
    required this.code,
    required this.status,
    required this.rentFee,
    required this.rentFeeCurrency,
    required this.unitId,
    this.paymentFrequency,
    this.moveInDate,
    this.activatedAt,
    this.stayDuration,
    this.stayDurationFrequency,
    this.keyHandoverDate,
    this.propertyInspectionDate,
    this.leaseAgreementDocumentUrl,
    this.createdAt,
    this.unit,
    this.tenantApplication,
  });

  factory LeaseModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseModelToJson(this);
}
