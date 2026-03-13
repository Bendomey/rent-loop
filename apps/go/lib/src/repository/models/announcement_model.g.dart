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
      propertyId: json['property_id'] as String?,
      propertyBlockId: json['property_block_id'] as String?,
      publishedAt: json['published_at'] as String?,
      expiresAt: json['expires_at'] as String?,
      createdAt: json['created_at'] as String?,
    );

Map<String, dynamic> _$AnnouncementModelToJson(AnnouncementModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'content': instance.content,
      'type': instance.type,
      'priority': instance.priority,
      'status': instance.status,
      'property_id': instance.propertyId,
      'property_block_id': instance.propertyBlockId,
      'published_at': instance.publishedAt,
      'expires_at': instance.expiresAt,
      'created_at': instance.createdAt,
    };
