import 'package:json_annotation/json_annotation.dart';

part 'lease_checklist_model.g.dart';

/// A single item on an inspection report. `photos` is real backend data
/// (`pq.StringArray`) but there is no upload UI for it anywhere in the
/// product (confirmed against the web checklist item form) — kept on the
/// model for parity, deliberately not rendered.
@JsonSerializable()
class LeaseChecklistItemModel {
  final String id;
  @JsonKey(name: 'lease_checklist_id')
  final String leaseChecklistId;
  final String description;
  final String
  status; // PENDING | FUNCTIONAL | DAMAGED | MISSING | NEEDS_REPAIR | NOT_PRESENT
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

/// A tenant's response to a submitted checklist round (acknowledge or
/// dispute) — read-only history on mobile; responding is a tenant-side
/// (`apps/go`) action, never something the property manager app calls.
@JsonSerializable()
class LeaseChecklistAcknowledgmentModel {
  final String id;
  final int round;
  final String action; // ACKNOWLEDGED | DISPUTED
  final String? comment;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  LeaseChecklistAcknowledgmentModel({
    required this.id,
    required this.round,
    required this.action,
    this.comment,
    this.createdAt,
  });

  factory LeaseChecklistAcknowledgmentModel.fromJson(
    Map<String, dynamic> json,
  ) => _$LeaseChecklistAcknowledgmentModelFromJson(json);

  Map<String, dynamic> toJson() =>
      _$LeaseChecklistAcknowledgmentModelToJson(this);
}

/// A move-in/move-out/routine inspection report. Real CRUD on mobile —
/// create, add/edit/delete items, submit for tenant review. Acknowledging or
/// disputing a submitted report is a tenant-side action (`apps/go`), so
/// `acknowledgments` here is read-only history.
@JsonSerializable()
class LeaseChecklistModel {
  final String id;
  final String type; // CHECK_IN | CHECK_OUT | ROUTINE
  final String status; // DRAFT | SUBMITTED | ACKNOWLEDGED | DISPUTED
  final int round;
  @JsonKey(name: 'check_in_checklist_id')
  final String? checkInChecklistId;
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
    required this.type,
    required this.status,
    this.round = 1,
    this.checkInChecklistId,
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
