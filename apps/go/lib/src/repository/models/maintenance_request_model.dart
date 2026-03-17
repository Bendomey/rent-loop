import 'package:json_annotation/json_annotation.dart';

part 'maintenance_request_model.g.dart';

@JsonSerializable()
class MaintenanceUnitModel {
  final String id;
  final String name;
  final String slug;

  MaintenanceUnitModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory MaintenanceUnitModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceUnitModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceUnitModelToJson(this);
}

@JsonSerializable()
class MaintenanceExpenseModel {
  final String id;
  final double? amount;
  final String? currency;
  final String? description;
  @JsonKey(name: 'billable_to_tenant')
  final bool? billableToTenant;
  @JsonKey(name: 'paid_by')
  final String? paidBy;
  @JsonKey(name: 'context_type')
  final String? contextType;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  MaintenanceExpenseModel({
    required this.id,
    this.amount,
    this.currency,
    this.description,
    this.billableToTenant,
    this.paidBy,
    this.contextType,
    this.createdAt,
  });

  factory MaintenanceExpenseModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceExpenseModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceExpenseModelToJson(this);
}

@JsonSerializable()
class MaintenanceActivityLogModel {
  final String id;
  final String? action;
  final String? description;
  final Map<String, dynamic>? metadata;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'maintenance_request_id')
  final String? maintenanceRequestId;
  @JsonKey(name: 'performed_by_tenant_id')
  final String? performedByTenantId;

  MaintenanceActivityLogModel({
    required this.id,
    this.action,
    this.description,
    this.metadata,
    this.createdAt,
    this.maintenanceRequestId,
    this.performedByTenantId,
  });

  factory MaintenanceActivityLogModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceActivityLogModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceActivityLogModelToJson(this);
}

@JsonSerializable()
class MaintenanceRequestModel {
  final String id;
  final String? title;
  final String? description;
  final String? category;
  final String? priority;
  final String? status;
  final String? code;
  @JsonKey(name: 'unit_id')
  final String? unitId;
  @JsonKey(name: 'lease_id')
  final String? leaseId;
  final List<String>? attachments;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;
  @JsonKey(name: 'resolved_at')
  final String? resolvedAt;
  @JsonKey(name: 'started_at')
  final String? startedAt;
  @JsonKey(name: 'canceled_at')
  final String? canceledAt;
  @JsonKey(name: 'cancellation_reason')
  final String? cancellationReason;
  final MaintenanceUnitModel? unit;
  @JsonKey(name: 'activity_logs')
  final List<MaintenanceActivityLogModel>? activityLogs;
  final List<MaintenanceExpenseModel>? expenses;

  MaintenanceRequestModel({
    required this.id,
    this.title,
    this.description,
    this.category,
    this.priority,
    this.status,
    this.code,
    this.unitId,
    this.leaseId,
    this.attachments,
    this.createdAt,
    this.updatedAt,
    this.resolvedAt,
    this.startedAt,
    this.canceledAt,
    this.cancellationReason,
    this.unit,
    this.activityLogs,
    this.expenses,
  });

  /// Returns the latest activity log sorted by createdAt descending.
  MaintenanceActivityLogModel? get latestActivityLog {
    if (activityLogs == null || activityLogs!.isEmpty) return null;
    final sorted = [...activityLogs!];
    sorted.sort((a, b) {
      final aDate = a.createdAt != null
          ? DateTime.tryParse(a.createdAt!)
          : null;
      final bDate = b.createdAt != null
          ? DateTime.tryParse(b.createdAt!)
          : null;
      if (aDate == null && bDate == null) return 0;
      if (aDate == null) return 1;
      if (bDate == null) return -1;
      return bDate.compareTo(aDate);
    });
    return sorted.first;
  }

  factory MaintenanceRequestModel.fromJson(Map<String, dynamic> json) =>
      _$MaintenanceRequestModelFromJson(json);

  Map<String, dynamic> toJson() => _$MaintenanceRequestModelToJson(this);
}
