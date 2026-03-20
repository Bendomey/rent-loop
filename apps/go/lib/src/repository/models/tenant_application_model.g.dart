// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_application_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TenantApplicationModel _$TenantApplicationModelFromJson(
        Map<String, dynamic> json) =>
    TenantApplicationModel(
      id: json['id'] as String,
      code: json['code'] as String,
      status: json['status'] as String,
      desiredMoveInDate: json['desired_move_in_date'] as String?,
      stayDuration: (json['stay_duration'] as num?)?.toInt(),
      stayDurationFrequency: json['stay_duration_frequency'] as String?,
      rentFee: (json['rent_fee'] as num).toInt(),
      rentFeeCurrency: json['rent_fee_currency'] as String,
      paymentFrequency: json['payment_frequency'] as String?,
      initialDepositFee: (json['initial_deposit_fee'] as num?)?.toInt(),
      initialDepositFeeCurrency:
          json['initial_deposit_fee_currency'] as String?,
      securityDepositFee: (json['security_deposit_fee'] as num?)?.toInt(),
      securityDepositFeeCurrency:
          json['security_deposit_fee_currency'] as String?,
      leaseAgreementDocumentStatus:
          json['lease_agreement_document_status'] as String?,
      createdAt: json['created_at'] as String?,
      completedAt: json['completed_at'] as String?,
      cancelledAt: json['cancelled_at'] as String?,
    );

Map<String, dynamic> _$TenantApplicationModelToJson(
        TenantApplicationModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
      'desired_move_in_date': instance.desiredMoveInDate,
      'stay_duration': instance.stayDuration,
      'stay_duration_frequency': instance.stayDurationFrequency,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'initial_deposit_fee': instance.initialDepositFee,
      'initial_deposit_fee_currency': instance.initialDepositFeeCurrency,
      'security_deposit_fee': instance.securityDepositFee,
      'security_deposit_fee_currency': instance.securityDepositFeeCurrency,
      'lease_agreement_document_status': instance.leaseAgreementDocumentStatus,
      'created_at': instance.createdAt,
      'completed_at': instance.completedAt,
      'cancelled_at': instance.cancelledAt,
    };
