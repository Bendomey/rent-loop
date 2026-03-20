import 'package:json_annotation/json_annotation.dart';

part 'unit_model.g.dart';

@JsonSerializable()
class UnitModel {
  final String id;
  final String slug;
  final String name;
  final String? description;
  final List<String> images;
  final List<String> tags;
  final String type;
  final double? area;
  @JsonKey(name: 'rent_fee')
  final int rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  final Map<String, dynamic>? features;
  final String status;

  UnitModel({
    required this.id,
    required this.slug,
    required this.name,
    this.description,
    required this.images,
    required this.tags,
    required this.type,
    this.area,
    required this.rentFee,
    required this.rentFeeCurrency,
    this.paymentFrequency,
    this.features,
    required this.status,
  });

  factory UnitModel.fromJson(Map<String, dynamic> json) =>
      _$UnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$UnitModelToJson(this);
}
