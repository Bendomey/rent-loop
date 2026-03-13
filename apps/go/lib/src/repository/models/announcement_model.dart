import 'package:json_annotation/json_annotation.dart';

part 'announcement_model.g.dart';

@JsonSerializable()
class AnnouncementModel {
  final String id;
  final String title;
  final String content;
  final String type;
  final String priority;
  final String status;
  @JsonKey(name: 'property_id')
  final String? propertyId;
  @JsonKey(name: 'property_block_id')
  final String? propertyBlockId;
  @JsonKey(name: 'published_at')
  final String? publishedAt;
  @JsonKey(name: 'expires_at')
  final String? expiresAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    required this.priority,
    required this.status,
    this.propertyId,
    this.propertyBlockId,
    this.publishedAt,
    this.expiresAt,
    this.createdAt,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) =>
      _$AnnouncementModelFromJson(json);

  Map<String, dynamic> toJson() => _$AnnouncementModelToJson(this);
}
