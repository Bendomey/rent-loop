import 'package:json_annotation/json_annotation.dart';

part 'payment_account_model.g.dart';

/// Deliberately minimal — only what the onboarding checklist needs right
/// now. A future payment-accounts-module integration pass extends this
/// class with the rest of the fields, not a new class.
@JsonSerializable()
class PaymentAccountModel {
  final String id;

  PaymentAccountModel({required this.id});

  factory PaymentAccountModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentAccountModelToJson(this);
}
