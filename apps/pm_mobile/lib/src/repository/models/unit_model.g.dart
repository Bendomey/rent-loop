// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UnitModel _$UnitModelFromJson(Map<String, dynamic> json) => UnitModel(
  id: json['id'] as String,
  name: json['name'] as String,
  type: json['type'] as String,
  status: json['status'] as String,
  rentFee: (json['rent_fee'] as num).toInt(),
  rentFeeCurrency: json['rent_fee_currency'] as String,
  area: (json['area'] as num?)?.toDouble(),
  images: (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
  createdAt: json['created_at'] as String?,
);

Map<String, dynamic> _$UnitModelToJson(UnitModel instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'type': instance.type,
  'status': instance.status,
  'rent_fee': instance.rentFee,
  'rent_fee_currency': instance.rentFeeCurrency,
  'area': instance.area,
  'images': instance.images,
  'created_at': instance.createdAt,
};
