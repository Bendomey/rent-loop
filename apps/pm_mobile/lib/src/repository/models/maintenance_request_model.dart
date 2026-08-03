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

  /// The block this unit sits in, when the caller populated it. Shown as
  /// context on a unit row so a name like "003" is never orphaned.
  @JsonKey(name: 'property_block')
  final MaintenanceBlockModel? propertyBlock;

  MaintenanceUnitModel({
    required this.id,
    required this.name,
    required this.slug,
    this.propertyId,
    this.propertyBlock,
  });

  factory MaintenanceUnitModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceUnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceUnitModelToJson(this);
}

@JsonSerializable()
class MaintenanceBlockModel {
  final String id;
  final String name;

  MaintenanceBlockModel({required this.id, required this.name});

  factory MaintenanceBlockModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceBlockModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceBlockModelToJson(this);
}

/// One asset a maintenance request concerns. Exactly one of [unit] /
/// [propertyBlock] is populated, matching [assetType]. A block asset is
/// common-area work that belongs to no unit, so a request can legitimately
/// have no units at all.
@JsonSerializable()
class MaintenanceAssetModel {
  final String id;
  @JsonKey(name: 'asset_type')
  final String assetType; // UNIT | BLOCK
  @JsonKey(name: 'unit_id')
  final String? unitId;
  final MaintenanceUnitModel? unit;
  @JsonKey(name: 'property_block_id')
  final String? propertyBlockId;
  @JsonKey(name: 'property_block')
  final MaintenanceBlockModel? propertyBlock;

  MaintenanceAssetModel({
    required this.id,
    required this.assetType,
    this.unitId,
    this.unit,
    this.propertyBlockId,
    this.propertyBlock,
  });

  bool get isUnit => assetType == 'UNIT';
  bool get isBlock => assetType == 'BLOCK';

  /// Display label, falling back to the asset type so a row is never blank
  /// when the API returned the association without populating the relation.
  String get label {
    if (isUnit) return unit?.name ?? 'Unit';
    return propertyBlock?.name ?? 'Block';
  }

  factory MaintenanceAssetModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceAssetModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceAssetModelToJson(this);
}

/// The tenant who raised a request, when one did. Only the name is modelled —
/// the History timeline is the sole consumer and it just needs someone to
/// attribute "Submitted by …" to.
@JsonSerializable()
class MaintenanceTenantModel {
  final String id;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'last_name')
  final String lastName;

  const MaintenanceTenantModel({
    required this.id,
    required this.firstName,
    required this.lastName,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory MaintenanceTenantModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceTenantModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceTenantModelToJson(this);
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
  @JsonKey(name: 'property_id')
  final String propertyId;
  final List<MaintenanceAssetModel>? assets;
  @JsonKey(name: 'lease_id')
  final String? leaseId;

  /// Who raised the request. The History tab branches on these exactly as the
  /// web portal's activity tab does: both set means a manager filed it on the
  /// tenant's behalf, manager-only means they filed it themselves, and
  /// tenant-only means the tenant submitted it.
  @JsonKey(name: 'created_by_tenant_id')
  final String? createdByTenantId;
  @JsonKey(name: 'created_by_tenant')
  final MaintenanceTenantModel? createdByTenant;
  @JsonKey(name: 'created_by_client_user_id')
  final String? createdByClientUserId;

  /// Raw attachment URLs. The API omits the key entirely when there are none,
  /// so this defaults to empty rather than being nullable — callers always
  /// get a list they can length-check.
  @JsonKey(defaultValue: <String>[])
  final List<String> attachments;

  /// `TENANT_VISIBLE` | `INTERNAL_ONLY`. Defaulted rather than required so a
  /// payload predating the column still parses; the backend column itself is
  /// non-null with the same default.
  @JsonKey(defaultValue: 'TENANT_VISIBLE')
  final String visibility;
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
  @JsonKey(name: 'reviewed_at')
  final String? reviewedAt;
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
    required this.propertyId,
    this.assets,
    this.leaseId,
    this.createdByTenantId,
    this.createdByTenant,
    this.createdByClientUserId,
    this.attachments = const [],
    this.visibility = 'TENANT_VISIBLE',
    this.assignedWorkerId,
    this.assignedWorker,
    this.assignedManagerId,
    this.assignedManager,
    this.cancellationReason,
    this.startedAt,
    this.reviewedAt,
    this.resolvedAt,
    this.canceledAt,
    this.createdAt,
    this.updatedAt,
  });

  /// Unit assets only, never null. Screens iterate these directly.
  List<MaintenanceAssetModel> get unitAssets =>
      assets?.where((a) => a.isUnit).toList() ?? const [];

  /// Block assets only, never null. A block-only request is common-area work
  /// and has no units.
  List<MaintenanceAssetModel> get blockAssets =>
      assets?.where((a) => a.isBlock).toList() ?? const [];

  /// Compact label for list/board cards: names the first asset and counts the
  /// rest, so a request covering six units reads "A1 +5" rather than a wall
  /// of names.
  String get assetSummary {
    final all = assets ?? const <MaintenanceAssetModel>[];
    if (all.isEmpty) return '—';
    final first = all.first.label;
    return all.length > 1 ? '$first +${all.length - 1}' : first;
  }

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
Object? _assigneeToJsonUnsupported(
  MaintenanceAssigneeModel? _,
) => throw UnsupportedError(
  'MaintenanceRequestModel.toJson does not support assignedWorker/assignedManager',
);
