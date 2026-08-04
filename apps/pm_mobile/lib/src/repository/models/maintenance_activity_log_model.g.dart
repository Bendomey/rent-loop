// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_activity_log_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceActivityLogModel _$MaintenanceActivityLogModelFromJson(
  Map<String, dynamic> json,
) => MaintenanceActivityLogModel(
  id: json['id'] as String,
  maintenanceRequestId: json['maintenance_request_id'] as String,
  action: json['action'] as String,
  description: json['description'] as String?,
  performedByClientUser: _actorFromJson(json['performed_by_client_user']),
  performedByTenantId: json['performed_by_tenant_id'] as String?,
  metadata: json['metadata'] as Map<String, dynamic>?,
  createdAt: json['created_at'] as String?,
);
