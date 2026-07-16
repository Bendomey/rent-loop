import 'package:json_annotation/json_annotation.dart';

import 'package:rentloop_manager/src/repository/models/client_model.dart';

part 'client_user_model.g.dart';

@JsonSerializable()
class ClientUserModel {
  final String id;
  @JsonKey(name: 'client_id')
  final String clientId;
  final String role;
  final String status;
  final ClientModel? client;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  ClientUserModel({
    required this.id,
    required this.clientId,
    required this.role,
    required this.status,
    this.client,
    this.createdAt,
    this.updatedAt,
  });

  factory ClientUserModel.fromJson(Map<String, dynamic> json) =>
      _$ClientUserModelFromJson(json);

  Map<String, dynamic> toJson() => _$ClientUserModelToJson(this);
}
