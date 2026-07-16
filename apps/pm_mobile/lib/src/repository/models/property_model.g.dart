// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PropertyModel _$PropertyModelFromJson(
  Map<String, dynamic> json,
) => PropertyModel(
  id: json['id'] as String,
  name: json['name'] as String,
  type: json['type'] as String,
  status: json['status'] as String,
  address: json['address'] as String?,
  city: json['city'] as String?,
  region: json['region'] as String?,
  images: (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
  modes: (json['modes'] as List<dynamic>?)?.map((e) => e as String).toList(),
);

Map<String, dynamic> _$PropertyModelToJson(PropertyModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'type': instance.type,
      'status': instance.status,
      'address': instance.address,
      'city': instance.city,
      'region': instance.region,
      'images': instance.images,
      'modes': instance.modes,
    };
