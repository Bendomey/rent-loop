import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_activity_log_model.g.dart';

/// One entry in a maintenance request's History timeline
/// (`GET .../maintenance-requests/{id}/activity_logs`).
///
/// [action] is the backend enum — `CREATED`, `STATUS_CHANGED`,
/// `WORKER_ASSIGNED`, `MANAGER_ASSIGNED`, `RESOLVED`, `CANCELED`, `NOTE`.
/// The UI maps it to an icon/tone; [description] carries the human sentence
/// the backend already composed, so the timeline never has to reconstruct
/// one from [metadata].
@JsonSerializable(createToJson: false)
class MaintenanceActivityLogModel {
  final String id;
  @JsonKey(name: 'maintenance_request_id')
  final String maintenanceRequestId;
  final String action;
  final String? description;
  @JsonKey(name: 'performed_by_client_user', fromJson: _actorFromJson)
  final MaintenanceAssigneeModel? performedByClientUser;
  @JsonKey(name: 'performed_by_tenant_id')
  final String? performedByTenantId;

  /// Free-form JSON the backend attaches per action (e.g. from/to status).
  /// Deliberately untyped — the timeline reads [description] for its body and
  /// does not depend on this shape.
  final Map<String, dynamic>? metadata;

  @JsonKey(name: 'created_at')
  final String? createdAt;

  MaintenanceActivityLogModel({
    required this.id,
    required this.maintenanceRequestId,
    required this.action,
    this.description,
    this.performedByClientUser,
    this.performedByTenantId,
    this.metadata,
    this.createdAt,
  });

  factory MaintenanceActivityLogModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceActivityLogModelFromJson(json);
}

MaintenanceAssigneeModel? _actorFromJson(Object? json) {
  if (json == null) return null;
  return MaintenanceAssigneeModel.fromJson(json as Map<String, dynamic>);
}
