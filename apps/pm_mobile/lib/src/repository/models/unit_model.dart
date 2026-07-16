import 'package:json_annotation/json_annotation.dart';

part 'unit_model.g.dart';

@JsonSerializable()
class UnitModel {
  final String id;
  final String name;
  final String type;
  final String status;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  final double? area;
  final List<String>? images;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  UnitModel({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.area,
    this.images,
    this.createdAt,
  });

  factory UnitModel.fromJson(Map<String, dynamic> json) =>
      _$UnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$UnitModelToJson(this);
}
