import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';

part 'announcement_model.g.dart';

@JsonSerializable()
class AnnouncementModel {
  final String id;
  final String title;
  final String content;
  final String type;
  final String priority;
  final String status;
  @JsonKey(name: 'published_at')
  final String? publishedAt;
  @JsonKey(name: 'scheduled_at')
  final String? scheduledAt;
  @JsonKey(name: 'created_at')
  final String createdAt;
  @JsonKey(name: 'property_id')
  final String? propertyId;
  final PropertyModel? property;
  @JsonKey(name: 'property_block_id')
  final String? propertyBlockId;
  @JsonKey(name: 'target_unit_ids', defaultValue: <String>[])
  final List<String> targetUnitIds;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    required this.priority,
    required this.status,
    required this.createdAt,
    this.publishedAt,
    this.scheduledAt,
    this.propertyId,
    this.property,
    this.propertyBlockId,
    this.targetUnitIds = const [],
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) =>
      _$AnnouncementModelFromJson(json);

  Map<String, dynamic> toJson() => _$AnnouncementModelToJson(this);
}

class AnnouncementsPage {
  AnnouncementsPage({required this.rows, required this.meta});

  final List<AnnouncementModel> rows;
  final PaginationMetaModel meta;
}
