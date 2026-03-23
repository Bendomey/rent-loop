import 'package:json_annotation/json_annotation.dart';

part 'payment_account_model.g.dart';

@JsonSerializable()
class PaymentAccountModel {
  final String id;
  @JsonKey(name: 'owner_type')
  final String ownerType; // PROPERTY_OWNER, RENTLOOP, SYSTEM
  final String rail; // MOMO, BANK_TRANSFER, CARD, OFFLINE
  final String? provider; // MTN, VODAFONE, AIRTELTIGO, PAYSTACK, BANK_API, CASH
  final String? identifier; // phone number, account number, etc.
  @JsonKey(name: 'is_default')
  final bool isDefault;
  final String status; // ACTIVE, DISABLED

  PaymentAccountModel({
    required this.id,
    required this.ownerType,
    required this.rail,
    required this.isDefault,
    required this.status,
    this.provider,
    this.identifier,
  });

  factory PaymentAccountModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentAccountModelToJson(this);

  /// Human-readable label for UI display (e.g. "MTN Momo • 0241234567")
  String get displayLabel {
    final parts = <String>[];
    if (provider != null) parts.add(_providerLabel(provider!));
    if (identifier != null) parts.add(identifier!);
    return parts.isNotEmpty ? parts.join(' • ') : rail;
  }

  String _providerLabel(String p) {
    return switch (p) {
      'MTN' => 'MTN Momo',
      'VODAFONE' => 'Telecel Cash',
      'AIRTELTIGO' => 'AirtelTigo Money',
      'PAYSTACK' => 'Paystack',
      'BANK_API' => 'Bank',
      'CASH' => 'Cash',
      _ => p,
    };
  }
}
