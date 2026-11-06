// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_account_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaymentAccountModel _$PaymentAccountModelFromJson(Map<String, dynamic> json) =>
    PaymentAccountModel(
      id: json['id'] as String,
      rail: json['rail'] as String?,
      provider: json['provider'] as String?,
      identifier: json['identifier'] as String?,
      status: json['status'] as String?,
      isDefault: json['is_default'] as bool? ?? false,
    );

Map<String, dynamic> _$PaymentAccountModelToJson(
  PaymentAccountModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'rail': instance.rail,
  'provider': instance.provider,
  'identifier': instance.identifier,
  'status': instance.status,
  'is_default': instance.isDefault,
};
