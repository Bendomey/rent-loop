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
    );

Map<String, dynamic> _$MaintenanceUnitModelToJson(
        MaintenanceUnitModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
    };

MaintenanceExpenseModel _$MaintenanceExpenseModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceExpenseModel(
      id: json['id'] as String,
      amount: (json['amount'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      description: json['description'] as String?,
      billableToTenant: json['billable_to_tenant'] as bool?,
      paidBy: json['paid_by'] as String?,
      contextType: json['context_type'] as String?,
      createdAt: json['created_at'] as String?,
    );

Map<String, dynamic> _$MaintenanceExpenseModelToJson(
        MaintenanceExpenseModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'amount': instance.amount,
      'currency': instance.currency,
      'description': instance.description,
      'billable_to_tenant': instance.billableToTenant,
      'paid_by': instance.paidBy,
      'context_type': instance.contextType,
      'created_at': instance.createdAt,
    };

MaintenanceActivityLogModel _$MaintenanceActivityLogModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceActivityLogModel(
      id: json['id'] as String,
      action: json['action'] as String?,
      description: json['description'] as String?,
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
      unitId: json['unit_id'] as String?,
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
      unit: json['unit'] == null
          ? null
          : MaintenanceUnitModel.fromJson(json['unit'] as Map<String, dynamic>),
      activityLogs: (json['activity_logs'] as List<dynamic>?)
          ?.map((e) =>
              MaintenanceActivityLogModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      expenses: (json['expenses'] as List<dynamic>?)
          ?.map((e) =>
              MaintenanceExpenseModel.fromJson(e as Map<String, dynamic>))
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
      'unit_id': instance.unitId,
      'lease_id': instance.leaseId,
      'attachments': instance.attachments,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
      'resolved_at': instance.resolvedAt,
      'started_at': instance.startedAt,
      'canceled_at': instance.canceledAt,
      'cancellation_reason': instance.cancellationReason,
      'unit': instance.unit,
      'activity_logs': instance.activityLogs,
      'expenses': instance.expenses,
    };
