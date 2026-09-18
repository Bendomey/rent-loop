import 'package:json_annotation/json_annotation.dart';

part 'maintenance_financial_model.g.dart';

/// One costed line on a maintenance request
/// (`GET .../maintenance-requests/{id}/financials`).
///
/// This replaced an expenses-only view that showed just the part paid to a
/// contractor, so a request split between the tenant, a vendor and a
/// no-one-pays record appeared to have cost less than it did.
///
/// [amount] is integer pesewas, like every other amount the API returns —
/// render it through `pesewasToCedis`, never directly.
@JsonSerializable(createToJson: false)
class MaintenanceFinancialModel {
  final String id;
  final String description;
  final num amount;
  final String currency;

  /// RECORD_ONLY | TENANT_CHARGE | VENDOR_EXPENSE
  @JsonKey(name: 'settlement_type')
  final String settlementType;

  /// RECORDED | OUTSTANDING | INVOICED | PARTIALLY_SETTLED | SETTLED | VOIDED
  final String status;

  /// Whether the line can still be changed. Derived server-side from whatever
  /// it settles through, so it is the same guard the API enforces.
  @JsonKey(name: 'is_editable')
  final bool isEditable;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  MaintenanceFinancialModel({
    required this.id,
    required this.description,
    required this.amount,
    required this.currency,
    required this.settlementType,
    required this.status,
    required this.isEditable,
    this.createdAt,
  });

  factory MaintenanceFinancialModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceFinancialModelFromJson(json);

  /// What the landlord calls this line in the tab.
  String get settlementLabel => switch (settlementType) {
    'TENANT_CHARGE' => 'Tenant',
    'VENDOR_EXPENSE' => 'Vendor',
    _ => 'No one pays',
  };

  String get statusLabel => switch (status) {
    'RECORDED' => 'Recorded',
    'OUTSTANDING' => 'Outstanding',
    'INVOICED' => 'Invoiced',
    'PARTIALLY_SETTLED' => 'Part settled',
    'SETTLED' => 'Settled',
    'VOIDED' => 'Voided',
    _ => status,
  };
}
