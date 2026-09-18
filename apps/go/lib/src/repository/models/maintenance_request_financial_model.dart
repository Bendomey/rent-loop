import 'package:json_annotation/json_annotation.dart';

part 'maintenance_request_financial_model.g.dart';

int? _amountFromJson(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.round();
  return null;
}

/// A charge raised against the tenant by a maintenance request
/// (`GET /api/v1/leases/{leaseId}/maintenance-requests/{id}/financials`).
///
/// The route returns only lines the caller is being charged for. Costs the
/// landlord paid a contractor, and costs recorded with nobody paying, are
/// filtered out server-side — a tenant never sees what a repair cost the
/// landlord, only what they owe for it.
///
/// [amount] is integer pesewas, like every other amount the API returns.
@JsonSerializable(createToJson: false)
class MaintenanceRequestFinancialModel {
  final String id;

  @JsonKey(name: 'maintenance_request_id')
  final String? maintenanceRequestId;

  final String? description;

  @JsonKey(fromJson: _amountFromJson)
  final int? amount;

  final String? currency;

  /// OUTSTANDING | INVOICED | PARTIALLY_SETTLED | SETTLED | VOIDED
  final String? status;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  MaintenanceRequestFinancialModel({
    required this.id,
    this.maintenanceRequestId,
    this.description,
    this.amount,
    this.currency,
    this.status,
    this.createdAt,
  });

  factory MaintenanceRequestFinancialModel.fromJson(
    Map<String, dynamic> json,
  ) => _$MaintenanceRequestFinancialModelFromJson(json);
}
