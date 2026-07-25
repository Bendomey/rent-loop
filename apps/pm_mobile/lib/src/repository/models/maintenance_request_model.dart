import 'package:json_annotation/json_annotation.dart';

part 'maintenance_request_model.g.dart';

/// A person referenced on a maintenance request (assigned worker/manager) or
/// returned by the client-user-properties endpoint. Hand-written `fromJson`
/// rather than `@JsonSerializable` codegen: the two API shapes that produce
/// this model nest the name at different depths (`assigned_worker.user.name`
/// directly, vs. `client_user_properties` row's `client_user.user.name` one
/// level deeper) — callers pass in whichever JSON object already contains a
/// top-level `id` + nested `user.name`, so one small manual parse covers
/// both without two near-duplicate generated classes.
class MaintenanceAssigneeModel {
  const MaintenanceAssigneeModel({required this.id, this.name});

  final String id;
  final String? name;

  factory MaintenanceAssigneeModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return MaintenanceAssigneeModel(
      id: json['id'] as String,
      name: user?['name'] as String?,
    );
  }
}

@JsonSerializable()
class MaintenanceUnitModel {
  final String id;
  final String name;
  final String slug;
  @JsonKey(name: 'property_id')
  final String? propertyId;

  MaintenanceUnitModel({
    required this.id,
    required this.name,
    required this.slug,
    this.propertyId,
  });

  factory MaintenanceUnitModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceUnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceUnitModelToJson(this);
}

@JsonSerializable(explicitToJson: true)
class MaintenanceRequestModel {
  final String id;
  final String code;
  final String title;
  final String? description;
  final String category;
  final String priority;
  final String status;
  @JsonKey(name: 'unit_id')
  final String unitId;
  final MaintenanceUnitModel? unit;
  @JsonKey(name: 'assigned_worker_id')
  final String? assignedWorkerId;
  @JsonKey(
    name: 'assigned_worker',
    fromJson: _assigneeFromJson,
    toJson: _assigneeToJsonUnsupported,
  )
  final MaintenanceAssigneeModel? assignedWorker;
  @JsonKey(name: 'assigned_manager_id')
  final String? assignedManagerId;
  @JsonKey(
    name: 'assigned_manager',
    fromJson: _assigneeFromJson,
    toJson: _assigneeToJsonUnsupported,
  )
  final MaintenanceAssigneeModel? assignedManager;
  @JsonKey(name: 'cancellation_reason')
  final String? cancellationReason;
  @JsonKey(name: 'started_at')
  final String? startedAt;
  @JsonKey(name: 'resolved_at')
  final String? resolvedAt;
  @JsonKey(name: 'canceled_at')
  final String? canceledAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  MaintenanceRequestModel({
    required this.id,
    required this.code,
    required this.title,
    this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.unitId,
    this.unit,
    this.assignedWorkerId,
    this.assignedWorker,
    this.assignedManagerId,
    this.assignedManager,
    this.cancellationReason,
    this.startedAt,
    this.resolvedAt,
    this.canceledAt,
    this.createdAt,
    this.updatedAt,
  });

  factory MaintenanceRequestModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceRequestModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceRequestModelToJson(this);
}

MaintenanceAssigneeModel? _assigneeFromJson(Object? json) {
  if (json == null) return null;
  return MaintenanceAssigneeModel.fromJson(json as Map<String, dynamic>);
}

// This model is never serialized back to JSON for a request body — assignee
// changes go through dedicated assign-worker/assign-manager endpoints (out
// of scope for this pass), not a round-tripped MaintenanceRequestModel.
Object? _assigneeToJsonUnsupported(MaintenanceAssigneeModel? _) =>
    throw UnsupportedError(
      'MaintenanceRequestModel.toJson does not support assignedWorker/assignedManager',
    );
