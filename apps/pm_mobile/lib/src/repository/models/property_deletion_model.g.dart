// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'property_deletion_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PropertyDeletionBlockingReasonModel
    _$PropertyDeletionBlockingReasonModelFromJson(Map<String, dynamic> json) =>
        PropertyDeletionBlockingReasonModel(
          type: json['type'] as String,
          status: json['status'] as String,
          count: (json['count'] as num).toInt(),
          label: json['label'] as String,
        );

Map<String, dynamic> _$PropertyDeletionBlockingReasonModelToJson(
        PropertyDeletionBlockingReasonModel instance) =>
    <String, dynamic>{
      'type': instance.type,
      'status': instance.status,
      'count': instance.count,
      'label': instance.label,
    };

PropertyDeletionSummaryModel _$PropertyDeletionSummaryModelFromJson(
        Map<String, dynamic> json) =>
    PropertyDeletionSummaryModel(
      blocks: (json['blocks'] as num).toInt(),
      units: (json['units'] as num).toInt(),
      leases: (json['leases'] as num).toInt(),
      bookings: (json['bookings'] as num).toInt(),
      tenantApplications: (json['tenant_applications'] as num).toInt(),
    );

Map<String, dynamic> _$PropertyDeletionSummaryModelToJson(
        PropertyDeletionSummaryModel instance) =>
    <String, dynamic>{
      'blocks': instance.blocks,
      'units': instance.units,
      'leases': instance.leases,
      'bookings': instance.bookings,
      'tenant_applications': instance.tenantApplications,
    };

PropertyDeletionPreviewModel _$PropertyDeletionPreviewModelFromJson(
        Map<String, dynamic> json) =>
    PropertyDeletionPreviewModel(
      canDelete: json['can_delete'] as bool,
      blockingReasons: (json['blocking_reasons'] as List<dynamic>)
          .map((e) => PropertyDeletionBlockingReasonModel.fromJson(
              e as Map<String, dynamic>))
          .toList(),
      willBeDeleted: PropertyDeletionSummaryModel.fromJson(
          json['will_be_deleted'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$PropertyDeletionPreviewModelToJson(
        PropertyDeletionPreviewModel instance) =>
    <String, dynamic>{
      'can_delete': instance.canDelete,
      'blocking_reasons': instance.blockingReasons,
      'will_be_deleted': instance.willBeDeleted,
    };

PropertyRestorePreviewModel _$PropertyRestorePreviewModelFromJson(
        Map<String, dynamic> json) =>
    PropertyRestorePreviewModel(
      blocks: (json['blocks'] as num).toInt(),
      units: (json['units'] as num).toInt(),
      leases: (json['leases'] as num).toInt(),
      bookings: (json['bookings'] as num).toInt(),
      tenantApplications: (json['tenant_applications'] as num).toInt(),
    );

Map<String, dynamic> _$PropertyRestorePreviewModelToJson(
        PropertyRestorePreviewModel instance) =>
    <String, dynamic>{
      'blocks': instance.blocks,
      'units': instance.units,
      'leases': instance.leases,
      'bookings': instance.bookings,
      'tenant_applications': instance.tenantApplications,
    };
