// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_comment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceCommentModel _$MaintenanceCommentModelFromJson(
  Map<String, dynamic> json,
) => MaintenanceCommentModel(
  id: json['id'] as String,
  maintenanceRequestId: json['maintenance_request_id'] as String,
  content: json['content'] as String,
  createdByClientUserId: json['created_by_client_user_id'] as String?,
  createdByClientUser: _authorFromJson(json['created_by_client_user']),
  createdAt: json['created_at'] as String?,
  updatedAt: json['updated_at'] as String?,
);
