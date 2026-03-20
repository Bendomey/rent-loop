import 'package:json_annotation/json_annotation.dart';

part 'tenant_application_model.g.dart';

@JsonSerializable()
class TenantApplicationModel {
  final String id;
  final String code;
  final String status;
  @JsonKey(name: 'desired_move_in_date')
  final String? desiredMoveInDate;
  @JsonKey(name: 'stay_duration')
  final int? stayDuration;
  @JsonKey(name: 'stay_duration_frequency')
  final String? stayDurationFrequency;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'initial_deposit_fee')
  final int? initialDepositFee;
  @JsonKey(name: 'initial_deposit_fee_currency')
  final String? initialDepositFeeCurrency;
  @JsonKey(name: 'security_deposit_fee')
  final int? securityDepositFee;
  @JsonKey(name: 'security_deposit_fee_currency')
  final String? securityDepositFeeCurrency;
  @JsonKey(name: 'lease_agreement_document_status')
  final String? leaseAgreementDocumentStatus;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'completed_at')
  final String? completedAt;
  @JsonKey(name: 'cancelled_at')
  final String? cancelledAt;

  TenantApplicationModel({
    required this.id,
    required this.code,
    required this.status,
    this.desiredMoveInDate,
    this.stayDuration,
    this.stayDurationFrequency,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.initialDepositFee,
    this.initialDepositFeeCurrency,
    this.securityDepositFee,
    this.securityDepositFeeCurrency,
    this.leaseAgreementDocumentStatus,
    this.createdAt,
    this.completedAt,
    this.cancelledAt,
  });

  factory TenantApplicationModel.fromJson(Map<String, dynamic> json) =>
      _$TenantApplicationModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantApplicationModelToJson(this);
}
