import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_comment_model.g.dart';

/// A comment on a maintenance request
/// (`GET .../maintenance-requests/{id}/comments`).
@JsonSerializable(createToJson: false)
class MaintenanceCommentModel {
  final String id;
  @JsonKey(name: 'maintenance_request_id')
  final String maintenanceRequestId;
  final String content;
  @JsonKey(name: 'created_by_client_user_id')
  final String? createdByClientUserId;
  @JsonKey(name: 'created_by_client_user', fromJson: _authorFromJson)
  final MaintenanceAssigneeModel? createdByClientUser;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  MaintenanceCommentModel({
    required this.id,
    required this.maintenanceRequestId,
    required this.content,
    this.createdByClientUserId,
    this.createdByClientUser,
    this.createdAt,
    this.updatedAt,
  });

  factory MaintenanceCommentModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceCommentModelFromJson(json);
}

MaintenanceAssigneeModel? _authorFromJson(Object? json) {
  if (json == null) return null;
  return MaintenanceAssigneeModel.fromJson(json as Map<String, dynamic>);
}
