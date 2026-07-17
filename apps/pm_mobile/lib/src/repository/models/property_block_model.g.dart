// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_block_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PropertyBlockModel _$PropertyBlockModelFromJson(Map<String, dynamic> json) =>
    PropertyBlockModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      images: (json['images'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      status: json['status'] as String,
      unitsCount: (json['units_count'] as num).toInt(),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$PropertyBlockModelToJson(PropertyBlockModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'images': instance.images,
      'status': instance.status,
      'units_count': instance.unitsCount,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
