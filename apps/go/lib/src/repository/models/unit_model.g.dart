// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UnitModel _$UnitModelFromJson(Map<String, dynamic> json) => UnitModel(
      id: json['id'] as String,
      slug: json['slug'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      images:
          (json['images'] as List<dynamic>).map((e) => e as String).toList(),
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      type: json['type'] as String,
      area: (json['area'] as num?)?.toDouble(),
      rentFee: (json['rent_fee'] as num).toInt(),
      rentFeeCurrency: json['rent_fee_currency'] as String,
      paymentFrequency: json['payment_frequency'] as String?,
      features: json['features'] as Map<String, dynamic>?,
      status: json['status'] as String,
    );

Map<String, dynamic> _$UnitModelToJson(UnitModel instance) => <String, dynamic>{
      'id': instance.id,
      'slug': instance.slug,
      'name': instance.name,
      'description': instance.description,
      'images': instance.images,
      'tags': instance.tags,
      'type': instance.type,
      'area': instance.area,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'features': instance.features,
      'status': instance.status,
    };
