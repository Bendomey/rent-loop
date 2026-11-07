import 'package:json_annotation/json_annotation.dart';

part 'financial_account_model.g.dart';

@JsonSerializable()
class FinancialAccountModel {
  final String id;
  final String currency;
  @JsonKey(name: 'rent_billing_cadence')
  final String rentBillingCadence;
  @JsonKey(name: 'rent_billing_interval')
  final int rentBillingInterval;
  @JsonKey(name: 'auto_issue_days_before')
  final int autoIssueDaysBefore;
  final String status;
  @JsonKey(name: 'tenant_id')
  final String? tenantId;

  FinancialAccountModel({
    required this.id,
    required this.currency,
    required this.rentBillingCadence,
    required this.rentBillingInterval,
    required this.autoIssueDaysBefore,
    required this.status,
    this.tenantId,
  });

  factory FinancialAccountModel.fromJson(Map<String, dynamic> json) =>
      _$FinancialAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$FinancialAccountModelToJson(this);
}

/// [amount] is signed: a negative charge is a refund or credit.
@JsonSerializable()
class ChargeModel {
  final String id;
  final String name;
  final String category;
  final int amount;
  final String currency;
  @JsonKey(name: 'due_date')
  final String dueDate;
  @JsonKey(name: 'invoiced_amount')
  final int invoicedAmount;
  @JsonKey(name: 'settled_amount')
  final int settledAmount;
  @JsonKey(name: 'outstanding_amount')
  final int outstandingAmount;
  final String status;
  @JsonKey(name: 'voided_at')
  final String? voidedAt;
  @JsonKey(name: 'voided_reason')
  final String? voidedReason;
  @JsonKey(name: 'lease_id')
  final String? leaseId;
  @JsonKey(name: 'reverses_charge_instance_id')
  final String? reversesChargeInstanceId;

  ChargeModel({
    required this.id,
    required this.name,
    required this.category,
    required this.amount,
    required this.currency,
    required this.dueDate,
    required this.invoicedAmount,
    required this.settledAmount,
    required this.outstandingAmount,
    required this.status,
    this.voidedAt,
    this.voidedReason,
    this.leaseId,
    this.reversesChargeInstanceId,
  });

  factory ChargeModel.fromJson(Map<String, dynamic> json) =>
      _$ChargeModelFromJson(json);

  Map<String, dynamic> toJson() => _$ChargeModelToJson(this);
}

@JsonSerializable()
class FinancialAccountDetailModel {
  final FinancialAccountModel account;
  final List<ChargeModel> charges;
  @JsonKey(name: 'total_charged')
  final int totalCharged;
  @JsonKey(name: 'total_settled')
  final int totalSettled;
  @JsonKey(name: 'outstanding_amount')
  final int outstandingAmount;
  @JsonKey(name: 'available_credit')
  final int availableCredit;

  FinancialAccountDetailModel({
    required this.account,
    required this.charges,
    required this.totalCharged,
    required this.totalSettled,
    required this.outstandingAmount,
    required this.availableCredit,
  });

  factory FinancialAccountDetailModel.fromJson(Map<String, dynamic> json) =>
      _$FinancialAccountDetailModelFromJson(json);

  Map<String, dynamic> toJson() => _$FinancialAccountDetailModelToJson(this);
}
