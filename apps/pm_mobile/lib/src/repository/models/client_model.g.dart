// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'client_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ClientModel _$ClientModelFromJson(Map<String, dynamic> json) => ClientModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String?,
      subType: json['sub_type'] as String?,
      address: json['address'] as String?,
      city: json['city'] as String?,
      region: json['region'] as String?,
      country: json['country'] as String?,
      supportEmail: json['support_email'] as String?,
      supportPhone: json['support_phone'] as String?,
      websiteUrl: json['website_url'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$ClientModelToJson(ClientModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'sub_type': instance.subType,
      'address': instance.address,
      'city': instance.city,
      'region': instance.region,
      'country': instance.country,
      'support_email': instance.supportEmail,
      'support_phone': instance.supportPhone,
      'website_url': instance.websiteUrl,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
