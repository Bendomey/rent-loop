// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'announcement_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AnnouncementModel _$AnnouncementModelFromJson(Map<String, dynamic> json) =>
    AnnouncementModel(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      type: json['type'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      createdAt: json['created_at'] as String,
      publishedAt: json['published_at'] as String?,
      scheduledAt: json['scheduled_at'] as String?,
      propertyId: json['property_id'] as String?,
      property: json['property'] == null
          ? null
          : PropertyModel.fromJson(json['property'] as Map<String, dynamic>),
      propertyBlockId: json['property_block_id'] as String?,
      targetUnitIds: (json['target_unit_ids'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );

Map<String, dynamic> _$AnnouncementModelToJson(AnnouncementModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'content': instance.content,
      'type': instance.type,
      'priority': instance.priority,
      'status': instance.status,
      'published_at': instance.publishedAt,
      'scheduled_at': instance.scheduledAt,
      'created_at': instance.createdAt,
      'property_id': instance.propertyId,
      'property': instance.property,
      'property_block_id': instance.propertyBlockId,
      'target_unit_ids': instance.targetUnitIds,
    };
