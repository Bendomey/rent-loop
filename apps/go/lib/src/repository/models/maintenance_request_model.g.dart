// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceActivityLogModel _$MaintenanceActivityLogModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceActivityLogModel(
      id: json['id'] as String,
      action: json['action'] as String?,
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['created_at'] as String?,
      maintenanceRequestId: json['maintenance_request_id'] as String?,
      performedByTenantId: json['performed_by_tenant_id'] as String?,
    );

Map<String, dynamic> _$MaintenanceActivityLogModelToJson(
        MaintenanceActivityLogModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'action': instance.action,
      'description': instance.description,
      'metadata': instance.metadata,
      'created_at': instance.createdAt,
      'maintenance_request_id': instance.maintenanceRequestId,
      'performed_by_tenant_id': instance.performedByTenantId,
    };

MaintenanceRequestModel _$MaintenanceRequestModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceRequestModel(
      id: json['id'] as String,
      title: json['title'] as String?,
      description: json['description'] as String?,
      category: json['category'] as String?,
      priority: json['priority'] as String?,
      status: json['status'] as String?,
      code: json['code'] as String?,
      leaseId: json['lease_id'] as String?,
      attachments: (json['attachments'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      resolvedAt: json['resolved_at'] as String?,
      startedAt: json['started_at'] as String?,
      canceledAt: json['canceled_at'] as String?,
      cancellationReason: json['cancellation_reason'] as String?,
      activityLogs: (json['activity_logs'] as List<dynamic>?)
          ?.map((e) =>
              MaintenanceActivityLogModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$MaintenanceRequestModelToJson(
        MaintenanceRequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'category': instance.category,
      'priority': instance.priority,
      'status': instance.status,
      'code': instance.code,
      'lease_id': instance.leaseId,
      'attachments': instance.attachments,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
      'resolved_at': instance.resolvedAt,
      'started_at': instance.startedAt,
      'canceled_at': instance.canceledAt,
      'cancellation_reason': instance.cancellationReason,
      'activity_logs': instance.activityLogs,
    };
