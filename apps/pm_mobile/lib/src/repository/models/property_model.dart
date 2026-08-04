import 'package:json_annotation/json_annotation.dart';

part 'property_model.g.dart';

/// Minimal nested shape for `deleted_by` — only `user.name` is ever shown
/// (the archived-properties list's "By {name}" caption), so this doesn't
/// model the full `OutputClientUser`/`OutputUser` backend DTOs.
@JsonSerializable()
class PropertyDeletedByModel {
  final PropertyDeletedByUserModel? user;

  PropertyDeletedByModel({this.user});

  factory PropertyDeletedByModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyDeletedByModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyDeletedByModelToJson(this);
}

@JsonSerializable()
class PropertyDeletedByUserModel {
  final String? name;

  PropertyDeletedByUserModel({this.name});

  factory PropertyDeletedByUserModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyDeletedByUserModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyDeletedByUserModelToJson(this);
}

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
  @JsonKey(name: 'blocks_count')
  final int blocksCount;
  @JsonKey(name: 'units_count')
  final int unitsCount;
  // Only populated on archived rows (GET .../properties?archived=true with
  // populate=DeletedBy.User) — null everywhere else.
  @JsonKey(name: 'deleted_at')
  final String? deletedAt;
  @JsonKey(name: 'deleted_by')
  final PropertyDeletedByModel? deletedBy;

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
    this.blocksCount = 0,
    this.unitsCount = 0,
    this.deletedAt,
    this.deletedBy,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyModelToJson(this);
}
