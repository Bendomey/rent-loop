// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payment_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PaymentModel _$PaymentModelFromJson(Map<String, dynamic> json) => PaymentModel(
      id: json['id'] as String,
      invoiceId: json['invoice_id'] as String,
      rail: json['rail'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      status: json['status'] as String,
      provider: json['provider'] as String?,
      reference: json['reference'] as String?,
      successfulAt: json['successful_at'] as String?,
      failedAt: json['failed_at'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$PaymentModelToJson(PaymentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'invoice_id': instance.invoiceId,
      'rail': instance.rail,
      'provider': instance.provider,
      'amount': instance.amount,
      'currency': instance.currency,
      'reference': instance.reference,
      'status': instance.status,
      'successful_at': instance.successfulAt,
      'failed_at': instance.failedAt,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };
