// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'unit_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UnitPropertyRef _$UnitPropertyRefFromJson(Map<String, dynamic> json) =>
    UnitPropertyRef(id: json['id'] as String, name: json['name'] as String);

Map<String, dynamic> _$UnitPropertyRefToJson(UnitPropertyRef instance) =>
    <String, dynamic>{'id': instance.id, 'name': instance.name};

UnitBlockRef _$UnitBlockRefFromJson(Map<String, dynamic> json) =>
    UnitBlockRef(id: json['id'] as String, name: json['name'] as String);

Map<String, dynamic> _$UnitBlockRefToJson(UnitBlockRef instance) =>
    <String, dynamic>{'id': instance.id, 'name': instance.name};

UnitModel _$UnitModelFromJson(Map<String, dynamic> json) => UnitModel(
  id: json['id'] as String,
  name: json['name'] as String,
  type: json['type'] as String,
  status: json['status'] as String,
  description: json['description'] as String?,
  rentFee: (json['rent_fee'] as num).toInt(),
  rentFeeCurrency: json['rent_fee_currency'] as String,
  paymentFrequency: json['payment_frequency'] as String?,
  maxOccupantsAllowed: (json['max_occupants_allowed'] as num?)?.toInt(),
  area: (json['area'] as num?)?.toDouble(),
  images: (json['images'] as List<dynamic>?)?.map((e) => e as String).toList(),
  propertyId: json['property_id'] as String?,
  property: json['property'] == null
      ? null
      : UnitPropertyRef.fromJson(json['property'] as Map<String, dynamic>),
  propertyBlockId: json['property_block_id'] as String?,
  propertyBlock: json['property_block'] == null
      ? null
      : UnitBlockRef.fromJson(json['property_block'] as Map<String, dynamic>),
  createdAt: json['created_at'] as String?,
  updatedAt: json['updated_at'] as String?,
);

Map<String, dynamic> _$UnitModelToJson(UnitModel instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'type': instance.type,
  'status': instance.status,
  'description': instance.description,
  'rent_fee': instance.rentFee,
  'rent_fee_currency': instance.rentFeeCurrency,
  'payment_frequency': instance.paymentFrequency,
  'max_occupants_allowed': instance.maxOccupantsAllowed,
  'area': instance.area,
  'images': instance.images,
  'property_id': instance.propertyId,
  'property': instance.property,
  'property_block_id': instance.propertyBlockId,
  'property_block': instance.propertyBlock,
  'created_at': instance.createdAt,
  'updated_at': instance.updatedAt,
};
