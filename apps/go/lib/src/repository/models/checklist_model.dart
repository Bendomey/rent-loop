import 'package:json_annotation/json_annotation.dart';

part 'checklist_model.g.dart';

@JsonSerializable()
class LeaseChecklistItemModel {
  final String id;
  @JsonKey(name: 'lease_checklist_id')
  final String leaseChecklistId;
  final String description;
  final String status;
  final String? notes;
  final List<String>? photos;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  LeaseChecklistItemModel({
    required this.id,
    required this.leaseChecklistId,
    required this.description,
    required this.status,
    this.notes,
    this.photos,
    this.createdAt,
    this.updatedAt,
  });

  factory LeaseChecklistItemModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseChecklistItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseChecklistItemModelToJson(this);
}

@JsonSerializable()
class LeaseChecklistAcknowledgmentModel {
  final String id;
  @JsonKey(name: 'lease_checklist_id')
  final String leaseChecklistId;
  @JsonKey(name: 'tenant_account_id')
  final String tenantAccountId;
  final int round;
  @JsonKey(name: 'submitted_at')
  final String? submittedAt;
  final String action;
  final String? comment;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  LeaseChecklistAcknowledgmentModel({
    required this.id,
    required this.leaseChecklistId,
    required this.tenantAccountId,
    required this.round,
    this.submittedAt,
    required this.action,
    this.comment,
    this.createdAt,
    this.updatedAt,
  });

  factory LeaseChecklistAcknowledgmentModel.fromJson(
    Map<String, dynamic> json,
  ) => _$LeaseChecklistAcknowledgmentModelFromJson(json);

  Map<String, dynamic> toJson() =>
      _$LeaseChecklistAcknowledgmentModelToJson(this);
}

@JsonSerializable()
class LeaseChecklistModel {
  final String id;
  @JsonKey(name: 'lease_id')
  final String leaseId;
  final String type;
  final String status;
  final int round;
  @JsonKey(name: 'submitted_at')
  final String? submittedAt;
  final List<LeaseChecklistItemModel>? items;
  final List<LeaseChecklistAcknowledgmentModel>? acknowledgments;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  LeaseChecklistModel({
    required this.id,
    required this.leaseId,
    required this.type,
    required this.status,
    required this.round,
    this.submittedAt,
    this.items,
    this.acknowledgments,
    this.createdAt,
    this.updatedAt,
  });

  factory LeaseChecklistModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseChecklistModelFromJson(json);

  Map<String, dynamic> toJson() => _$LeaseChecklistModelToJson(this);
}
