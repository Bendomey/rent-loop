import 'package:json_annotation/json_annotation.dart';

part 'maintenance_expense_model.g.dart';

/// An expense logged against a maintenance request
/// (`GET .../maintenance-requests/{id}/expenses`).
///
/// [amount] arrives as a major-unit figure (the backend's `OutputExpense.Amount`
/// is a float64 already in currency units), unlike invoice/payment amounts which
/// are integer pesewas — so it is displayed directly, not via `pesewasToCedis`.
@JsonSerializable(createToJson: false)
class MaintenanceExpenseModel {
  final String id;
  final String code;
  final String description;
  final num amount;
  final String currency;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  MaintenanceExpenseModel({
    required this.id,
    required this.code,
    required this.description,
    required this.amount,
    required this.currency,
    this.createdAt,
  });

  factory MaintenanceExpenseModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceExpenseModelFromJson(json);
}
