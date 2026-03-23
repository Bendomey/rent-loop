// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_account_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaymentAccountModel _$PaymentAccountModelFromJson(Map<String, dynamic> json) =>
    PaymentAccountModel(
      id: json['id'] as String,
      ownerType: json['owner_type'] as String,
      rail: json['rail'] as String,
      isDefault: json['is_default'] as bool,
      status: json['status'] as String,
      provider: json['provider'] as String?,
      identifier: json['identifier'] as String?,
    );

Map<String, dynamic> _$PaymentAccountModelToJson(
        PaymentAccountModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'owner_type': instance.ownerType,
      'rail': instance.rail,
      'provider': instance.provider,
      'identifier': instance.identifier,
      'is_default': instance.isDefault,
      'status': instance.status,
    };
