// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PropertyDeletedByModel _$PropertyDeletedByModelFromJson(
        Map<String, dynamic> json) =>
    PropertyDeletedByModel(
      user: json['user'] == null
          ? null
          : PropertyDeletedByUserModel.fromJson(
              json['user'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PropertyDeletedByModelToJson(
        PropertyDeletedByModel instance) =>
    <String, dynamic>{
      'user': instance.user,
    };

PropertyDeletedByUserModel _$PropertyDeletedByUserModelFromJson(
        Map<String, dynamic> json) =>
    PropertyDeletedByUserModel(
      name: json['name'] as String?,
    );

Map<String, dynamic> _$PropertyDeletedByUserModelToJson(
        PropertyDeletedByUserModel instance) =>
    <String, dynamic>{
      'name': instance.name,
    };

PropertyModel _$PropertyModelFromJson(Map<String, dynamic> json) =>
    PropertyModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      address: json['address'] as String?,
      city: json['city'] as String?,
      region: json['region'] as String?,
      images:
          (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
      modes:
          (json['modes'] as List<dynamic>?)?.map((e) => e as String).toList(),
      blocksCount: (json['blocks_count'] as num?)?.toInt() ?? 0,
      unitsCount: (json['units_count'] as num?)?.toInt() ?? 0,
      deletedAt: json['deleted_at'] as String?,
      deletedBy: json['deleted_by'] == null
          ? null
          : PropertyDeletedByModel.fromJson(
              json['deleted_by'] as Map<String, dynamic>),
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
      'blocks_count': instance.blocksCount,
      'units_count': instance.unitsCount,
      'deleted_at': instance.deletedAt,
      'deleted_by': instance.deletedBy,
    };
