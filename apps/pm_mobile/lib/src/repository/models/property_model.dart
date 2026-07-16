import 'package:json_annotation/json_annotation.dart';

part 'property_model.g.dart';

@JsonSerializable()
class PropertyModel {
  final String id;
  final String name;
  final String type;
  final String status;
  final String? address;
  final String? city;
  final String? region;
  final List<String>? images;
  final List<String>? modes;

  PropertyModel({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.address,
    this.city,
    this.region,
    this.images,
    this.modes,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyModelToJson(this);
}
