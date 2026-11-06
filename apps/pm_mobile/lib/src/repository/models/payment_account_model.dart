import 'package:json_annotation/json_annotation.dart';

part 'payment_account_model.g.dart';

@JsonSerializable()
class PaymentAccountModel {
  final String id;
  final String? rail;
  final String? provider;
  final String? identifier;
  final String? status;
  @JsonKey(name: 'is_default')
  final bool isDefault;

  PaymentAccountModel({
    required this.id,
    this.rail,
    this.provider,
    this.identifier,
    this.status,
    this.isDefault = false,
  });

  factory PaymentAccountModel.fromJson(Map<String, dynamic> json) =>
      _$PaymentAccountModelFromJson(json);

  Map<String, dynamic> toJson() => _$PaymentAccountModelToJson(this);
}
