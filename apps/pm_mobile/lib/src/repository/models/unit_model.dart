import 'package:json_annotation/json_annotation.dart';

part 'unit_model.g.dart';

/// Minimal property reference nested in a unit's detail response —
/// only the fields the unit detail screen displays (name).
@JsonSerializable()
class UnitPropertyRef {
  final String id;
  final String name;

  UnitPropertyRef({required this.id, required this.name});

  factory UnitPropertyRef.fromJson(Map<String, dynamic> json) =>
      _$UnitPropertyRefFromJson(json);

  Map<String, dynamic> toJson() => _$UnitPropertyRefToJson(this);
}

/// Minimal property-block reference nested in a unit's detail response —
/// only the fields the unit detail screen displays (name).
@JsonSerializable()
class UnitBlockRef {
  final String id;
  final String name;

  UnitBlockRef({required this.id, required this.name});

  factory UnitBlockRef.fromJson(Map<String, dynamic> json) =>
      _$UnitBlockRefFromJson(json);

  Map<String, dynamic> toJson() => _$UnitBlockRefToJson(this);
}

@JsonSerializable()
class UnitModel {
  final String id;
  final String name;
  final String type;
  final String status;
  final String? description;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'max_occupants_allowed')
  final int? maxOccupantsAllowed;
  final double? area;
  final List<String>? images;
  @JsonKey(name: 'property_id')
  final String? propertyId;
  final UnitPropertyRef? property;
  @JsonKey(name: 'property_block_id')
  final String? propertyBlockId;
  @JsonKey(name: 'property_block')
  final UnitBlockRef? propertyBlock;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  UnitModel({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.description,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.maxOccupantsAllowed,
    this.area,
    this.images,
    this.propertyId,
    this.property,
    this.propertyBlockId,
    this.propertyBlock,
    this.createdAt,
    this.updatedAt,
  });

  factory UnitModel.fromJson(Map<String, dynamic> json) =>
      _$UnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$UnitModelToJson(this);
}
