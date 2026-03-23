import 'package:json_annotation/json_annotation.dart';

part 'payment_model.g.dart';

@JsonSerializable()
class PaymentModel {
  final String id;
  @JsonKey(name: 'invoice_id')
  final String invoiceId;
  final String rail; // MOMO, BANK_TRANSFER, CARD, OFFLINE
  final String? provider; // MTN, VODAFONE, AIRTELTIGO, CASH, etc.
  final int amount;
  final String currency;
  final String? reference;
  final String status; // PENDING, SUCCESSFUL, FAILED
  @JsonKey(name: 'successful_at')
  final String? successfulAt;
  @JsonKey(name: 'failed_at')
  final String? failedAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  PaymentModel({
    required this.id,
    required this.invoiceId,
    required this.rail,
    required this.amount,
    required this.currency,
    required this.status,
    this.provider,
    this.reference,
    this.successfulAt,
    this.failedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentModelToJson(this);
}
