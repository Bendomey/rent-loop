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
      propertyBlock: json['property_block'] == null
          ? null
          : MaintenanceBlockModel.fromJson(
              json['property_block'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MaintenanceUnitModelToJson(
        MaintenanceUnitModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
      'property_id': instance.propertyId,
      'property_block': instance.propertyBlock,
    };

MaintenanceBlockModel _$MaintenanceBlockModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceBlockModel(
      id: json['id'] as String,
      name: json['name'] as String,
    );

Map<String, dynamic> _$MaintenanceBlockModelToJson(
        MaintenanceBlockModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
    };

MaintenanceAssetModel _$MaintenanceAssetModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceAssetModel(
      id: json['id'] as String,
      assetType: json['asset_type'] as String,
      unitId: json['unit_id'] as String?,
      unit: json['unit'] == null
          ? null
          : MaintenanceUnitModel.fromJson(json['unit'] as Map<String, dynamic>),
      propertyBlockId: json['property_block_id'] as String?,
      propertyBlock: json['property_block'] == null
          ? null
          : MaintenanceBlockModel.fromJson(
              json['property_block'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$MaintenanceAssetModelToJson(
        MaintenanceAssetModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'asset_type': instance.assetType,
      'unit_id': instance.unitId,
      'unit': instance.unit,
      'property_block_id': instance.propertyBlockId,
      'property_block': instance.propertyBlock,
    };

MaintenanceTenantModel _$MaintenanceTenantModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceTenantModel(
      id: json['id'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
    );

Map<String, dynamic> _$MaintenanceTenantModelToJson(
        MaintenanceTenantModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'first_name': instance.firstName,
      'last_name': instance.lastName,
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
      propertyId: json['property_id'] as String,
      assets: (json['assets'] as List<dynamic>?)
          ?.map(
              (e) => MaintenanceAssetModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      leaseId: json['lease_id'] as String?,
      createdByTenantId: json['created_by_tenant_id'] as String?,
      createdByTenant: json['created_by_tenant'] == null
          ? null
          : MaintenanceTenantModel.fromJson(
              json['created_by_tenant'] as Map<String, dynamic>),
      createdByClientUserId: json['created_by_client_user_id'] as String?,
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      visibility: json['visibility'] as String? ?? 'TENANT_VISIBLE',
      assignedWorkerId: json['assigned_worker_id'] as String?,
      assignedWorker: _assigneeFromJson(json['assigned_worker']),
      assignedManagerId: json['assigned_manager_id'] as String?,
      assignedManager: _assigneeFromJson(json['assigned_manager']),
      cancellationReason: json['cancellation_reason'] as String?,
      startedAt: json['started_at'] as String?,
      reviewedAt: json['reviewed_at'] as String?,
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
      'property_id': instance.propertyId,
      'assets': instance.assets?.map((e) => e.toJson()).toList(),
      'lease_id': instance.leaseId,
      'created_by_tenant_id': instance.createdByTenantId,
      'created_by_tenant': instance.createdByTenant?.toJson(),
      'created_by_client_user_id': instance.createdByClientUserId,
      'attachments': instance.attachments,
      'visibility': instance.visibility,
      'assigned_worker_id': instance.assignedWorkerId,
      'assigned_worker': _assigneeToJsonUnsupported(instance.assignedWorker),
      'assigned_manager_id': instance.assignedManagerId,
      'assigned_manager': _assigneeToJsonUnsupported(instance.assignedManager),
      'cancellation_reason': instance.cancellationReason,
      'started_at': instance.startedAt,
      'reviewed_at': instance.reviewedAt,
      'resolved_at': instance.resolvedAt,
      'canceled_at': instance.canceledAt,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
