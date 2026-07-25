// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceUnitModel _$MaintenanceUnitModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceUnitModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      propertyId: json['property_id'] as String?,
    );

Map<String, dynamic> _$MaintenanceUnitModelToJson(
        MaintenanceUnitModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'property_id': instance.propertyId,
    };

MaintenanceRequestModel _$MaintenanceRequestModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceRequestModel(
      id: json['id'] as String,
      code: json['code'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      unitId: json['unit_id'] as String,
      unit: json['unit'] == null
          ? null
          : MaintenanceUnitModel.fromJson(json['unit'] as Map<String, dynamic>),
      assignedWorkerId: json['assigned_worker_id'] as String?,
      assignedWorker: _assigneeFromJson(json['assigned_worker']),
      assignedManagerId: json['assigned_manager_id'] as String?,
      assignedManager: _assigneeFromJson(json['assigned_manager']),
      cancellationReason: json['cancellation_reason'] as String?,
      startedAt: json['started_at'] as String?,
      resolvedAt: json['resolved_at'] as String?,
      canceledAt: json['canceled_at'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$MaintenanceRequestModelToJson(
        MaintenanceRequestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'title': instance.title,
      'description': instance.description,
      'category': instance.category,
      'priority': instance.priority,
      'status': instance.status,
      'unit_id': instance.unitId,
      'unit': instance.unit?.toJson(),
      'assigned_worker_id': instance.assignedWorkerId,
      'assigned_worker': _assigneeToJsonUnsupported(instance.assignedWorker),
      'assigned_manager_id': instance.assignedManagerId,
      'assigned_manager': _assigneeToJsonUnsupported(instance.assignedManager),
      'cancellation_reason': instance.cancellationReason,
      'started_at': instance.startedAt,
      'resolved_at': instance.resolvedAt,
      'canceled_at': instance.canceledAt,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
