import 'package:json_annotation/json_annotation.dart';

part 'property_deletion_model.g.dart';

/// One reason a property can't be deleted yet — an active lease, an
/// active/pending booking, or a pending tenant application. `type` drives
/// which icon/deep-link the UI shows; mirrors
/// `services.PropertyDeletionBlockingReason` on the backend.
@JsonSerializable()
class PropertyDeletionBlockingReasonModel {
  final String type; // LEASE | BOOKING | TENANT_APPLICATION
  final String status;
  final int count;
  final String label;

  PropertyDeletionBlockingReasonModel({
    required this.type,
    required this.status,
    required this.count,
    required this.label,
  });

  factory PropertyDeletionBlockingReasonModel.fromJson(
    Map<String, dynamic> json,
  ) => _$PropertyDeletionBlockingReasonModelFromJson(json);

  Map<String, dynamic> toJson() =>
      _$PropertyDeletionBlockingReasonModelToJson(this);
}

/// Shared count shape for both "what will be archived" (deletion preview)
/// and "what comes back" (restore preview) — the backend returns the same
/// 5 fields for both, just from different endpoints.
@JsonSerializable()
class PropertyDeletionSummaryModel {
  final int blocks;
  final int units;
  final int leases;
  final int bookings;
  @JsonKey(name: 'tenant_applications')
  final int tenantApplications;

  PropertyDeletionSummaryModel({
    required this.blocks,
    required this.units,
    required this.leases,
    required this.bookings,
    required this.tenantApplications,
  });

  factory PropertyDeletionSummaryModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyDeletionSummaryModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyDeletionSummaryModelToJson(this);
}

@JsonSerializable()
class PropertyDeletionPreviewModel {
  @JsonKey(name: 'can_delete')
  final bool canDelete;
  @JsonKey(name: 'blocking_reasons')
  final List<PropertyDeletionBlockingReasonModel> blockingReasons;
  @JsonKey(name: 'will_be_deleted')
  final PropertyDeletionSummaryModel willBeDeleted;

  PropertyDeletionPreviewModel({
    required this.canDelete,
    required this.blockingReasons,
    required this.willBeDeleted,
  });

  factory PropertyDeletionPreviewModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyDeletionPreviewModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyDeletionPreviewModelToJson(this);
}

@JsonSerializable()
class PropertyRestorePreviewModel {
  final int blocks;
  final int units;
  final int leases;
  final int bookings;
  @JsonKey(name: 'tenant_applications')
  final int tenantApplications;

  PropertyRestorePreviewModel({
    required this.blocks,
    required this.units,
    required this.leases,
    required this.bookings,
    required this.tenantApplications,
  });

  factory PropertyRestorePreviewModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyRestorePreviewModelFromJson(json);

  Map<String, dynamic> toJson() => _$PropertyRestorePreviewModelToJson(this);
}
