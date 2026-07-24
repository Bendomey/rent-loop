// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LeaseModel _$LeaseModelFromJson(Map<String, dynamic> json) => LeaseModel(
  id: json['id'] as String,
  code: json['code'] as String,
  status: json['status'] as String,
  unitId: json['unit_id'] as String,
  unit: json['unit'] == null
      ? null
      : UnitModel.fromJson(json['unit'] as Map<String, dynamic>),
  tenantId: json['tenant_id'] as String,
  tenant: json['tenant'] == null
      ? null
      : TenantModel.fromJson(json['tenant'] as Map<String, dynamic>),
  tenantApplicationId: json['tenant_application_id'] as String?,
  tenantApplication: json['tenant_application'] == null
      ? null
      : TenantApplicationModel.fromJson(
          json['tenant_application'] as Map<String, dynamic>,
        ),
  rentFee: (json['rent_fee'] as num).toInt(),
  rentFeeCurrency: json['rent_fee_currency'] as String,
  paymentFrequency: json['payment_frequency'] as String?,
  moveInDate: json['move_in_date'] as String?,
  moveOutDate: json['move_out_date'] as String?,
  stayDurationFrequency: json['stay_duration_frequency'] as String?,
  stayDuration: (json['stay_duration'] as num?)?.toInt(),
  keyHandoverDate: json['key_handover_date'] as String?,
  utilityTransfersDate: json['utility_transfers_date'] as String?,
  propertyInspectionDate: json['property_inspection_date'] as String?,
  leaseAgreementDocumentUrl: json['lease_agreement_document_url'] as String?,
  terminationAgreementDocumentUrl:
      json['termination_agreement_document_url'] as String?,
  activatedAt: json['activated_at'] as String?,
  cancelledAt: json['cancelled_at'] as String?,
  completedAt: json['completed_at'] as String?,
  terminatedAt: json['terminated_at'] as String?,
  createdAt: json['created_at'] as String?,
  updatedAt: json['updated_at'] as String?,
);

Map<String, dynamic> _$LeaseModelToJson(LeaseModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
      'unit_id': instance.unitId,
      'unit': instance.unit,
      'tenant_id': instance.tenantId,
      'tenant': instance.tenant,
      'tenant_application_id': instance.tenantApplicationId,
      'tenant_application': instance.tenantApplication,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'move_in_date': instance.moveInDate,
      'move_out_date': instance.moveOutDate,
      'stay_duration_frequency': instance.stayDurationFrequency,
      'stay_duration': instance.stayDuration,
      'key_handover_date': instance.keyHandoverDate,
      'utility_transfers_date': instance.utilityTransfersDate,
      'property_inspection_date': instance.propertyInspectionDate,
      'lease_agreement_document_url': instance.leaseAgreementDocumentUrl,
      'termination_agreement_document_url':
          instance.terminationAgreementDocumentUrl,
      'activated_at': instance.activatedAt,
      'cancelled_at': instance.cancelledAt,
      'completed_at': instance.completedAt,
      'terminated_at': instance.terminatedAt,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
