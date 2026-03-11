// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lease_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LeaseUnitModel _$LeaseUnitModelFromJson(Map<String, dynamic> json) =>
    LeaseUnitModel(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
    );

Map<String, dynamic> _$LeaseUnitModelToJson(LeaseUnitModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'slug': instance.slug,
    };

LeaseModel _$LeaseModelFromJson(Map<String, dynamic> json) => LeaseModel(
      id: json['id'] as String,
      code: json['code'] as String,
      status: json['status'] as String,
      rentFee: (json['rent_fee'] as num).toInt(),
      rentFeeCurrency: json['rent_fee_currency'] as String,
      paymentFrequency: json['payment_frequency'] as String?,
      moveInDate: json['move_in_date'] as String?,
      activatedAt: json['activated_at'] as String?,
      stayDuration: (json['stay_duration'] as num?)?.toInt(),
      stayDurationFrequency: json['stay_duration_frequency'] as String?,
      keyHandoverDate: json['key_handover_date'] as String?,
      propertyInspectionDate: json['property_inspection_date'] as String?,
      leaseAgreementDocumentUrl:
          json['lease_agreement_document_url'] as String?,
      createdAt: json['created_at'] as String?,
      unit: json['unit'] == null
          ? null
          : LeaseUnitModel.fromJson(json['unit'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LeaseModelToJson(LeaseModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
      'rent_fee': instance.rentFee,
      'rent_fee_currency': instance.rentFeeCurrency,
      'payment_frequency': instance.paymentFrequency,
      'move_in_date': instance.moveInDate,
      'activated_at': instance.activatedAt,
      'stay_duration': instance.stayDuration,
      'stay_duration_frequency': instance.stayDurationFrequency,
      'key_handover_date': instance.keyHandoverDate,
      'property_inspection_date': instance.propertyInspectionDate,
      'lease_agreement_document_url': instance.leaseAgreementDocumentUrl,
      'created_at': instance.createdAt,
      'unit': instance.unit,
    };
