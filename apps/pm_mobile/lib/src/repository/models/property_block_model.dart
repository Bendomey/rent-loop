import 'package:json_annotation/json_annotation.dart';

part 'property_block_model.g.dart';

@JsonSerializable()
class PropertyBlockModel {
  final String id;
  final String name;
  final String? description;
  final List<String>? images;
  final String status;
  @JsonKey(name: 'units_count')
  final int unitsCount;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  PropertyBlockModel({
    required this.id,
    required this.name,
    this.description,
    this.images,
    required this.status,
    required this.unitsCount,
    this.createdAt,
    this.updatedAt,
  });

  factory PropertyBlockModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyBlockModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyBlockModelToJson(this);
}
