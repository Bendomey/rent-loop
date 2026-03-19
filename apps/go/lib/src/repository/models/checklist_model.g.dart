// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checklist_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LeaseChecklistItemModel _$LeaseChecklistItemModelFromJson(
        Map<String, dynamic> json) =>
    LeaseChecklistItemModel(
      id: json['id'] as String,
      leaseChecklistId: json['lease_checklist_id'] as String,
      description: json['description'] as String,
      status: json['status'] as String,
      notes: json['notes'] as String?,
      photos:
          (json['photos'] as List<dynamic>?)?.map((e) => e as String).toList(),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$LeaseChecklistItemModelToJson(
        LeaseChecklistItemModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'lease_checklist_id': instance.leaseChecklistId,
      'description': instance.description,
      'status': instance.status,
      'notes': instance.notes,
      'photos': instance.photos,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

LeaseChecklistAcknowledgmentModel _$LeaseChecklistAcknowledgmentModelFromJson(
        Map<String, dynamic> json) =>
    LeaseChecklistAcknowledgmentModel(
      id: json['id'] as String,
      leaseChecklistId: json['lease_checklist_id'] as String,
      tenantAccountId: json['tenant_account_id'] as String,
      round: (json['round'] as num).toInt(),
      submittedAt: json['submitted_at'] as String?,
      action: json['action'] as String,
      comment: json['comment'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$LeaseChecklistAcknowledgmentModelToJson(
        LeaseChecklistAcknowledgmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'lease_checklist_id': instance.leaseChecklistId,
      'tenant_account_id': instance.tenantAccountId,
      'round': instance.round,
      'submitted_at': instance.submittedAt,
      'action': instance.action,
      'comment': instance.comment,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

LeaseChecklistModel _$LeaseChecklistModelFromJson(Map<String, dynamic> json) =>
    LeaseChecklistModel(
      id: json['id'] as String,
      leaseId: json['lease_id'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      round: (json['round'] as num).toInt(),
      submittedAt: json['submitted_at'] as String?,
      items: (json['items'] as List<dynamic>?)
          ?.map((e) =>
              LeaseChecklistItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      acknowledgments: (json['acknowledgments'] as List<dynamic>?)
          ?.map((e) => LeaseChecklistAcknowledgmentModel.fromJson(
              e as Map<String, dynamic>))
          .toList(),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$LeaseChecklistModelToJson(
        LeaseChecklistModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'lease_id': instance.leaseId,
      'type': instance.type,
      'status': instance.status,
      'round': instance.round,
      'submitted_at': instance.submittedAt,
      'items': instance.items,
      'acknowledgments': instance.acknowledgments,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
