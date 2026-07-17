// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tenant_application_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceRef _$InvoiceRefFromJson(Map<String, dynamic> json) =>
    InvoiceRef(id: json['id'] as String, code: json['code'] as String);

Map<String, dynamic> _$InvoiceRefToJson(InvoiceRef instance) =>
    <String, dynamic>{'id': instance.id, 'code': instance.code};

TenantApplicationModel _$TenantApplicationModelFromJson(
  Map<String, dynamic> json,
) => TenantApplicationModel(
  id: json['id'] as String,
  code: json['code'] as String,
  rentFee: (json['rent_fee'] as num?)?.toInt(),
  rentFeeCurrency: json['rent_fee_currency'] as String?,
  paymentFrequency: json['payment_frequency'] as String?,
  initialDepositFee: (json['initial_deposit_fee'] as num?)?.toInt(),
  securityDepositFee: (json['security_deposit_fee'] as num?)?.toInt(),
  applicationPaymentInvoice: json['application_payment_invoice'] == null
      ? null
      : InvoiceRef.fromJson(
          json['application_payment_invoice'] as Map<String, dynamic>,
        ),
);

Map<String, dynamic> _$TenantApplicationModelToJson(
  TenantApplicationModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'code': instance.code,
  'rent_fee': instance.rentFee,
  'rent_fee_currency': instance.rentFeeCurrency,
  'payment_frequency': instance.paymentFrequency,
  'initial_deposit_fee': instance.initialDepositFee,
  'security_deposit_fee': instance.securityDepositFee,
  'application_payment_invoice': instance.applicationPaymentInvoice,
};
