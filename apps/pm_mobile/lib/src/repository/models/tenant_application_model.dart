import 'package:json_annotation/json_annotation.dart';

part 'tenant_application_model.g.dart';

/// Minimal invoice reference nested on a tenant application's
/// `application_payment_invoice` — only the fields the lease detail screen
/// links out to (code, id).
@JsonSerializable()
class InvoiceRef {
  final String id;
  final String code;

  InvoiceRef({required this.id, required this.code});

  factory InvoiceRef.fromJson(Map<String, dynamic> json) =>
      _$InvoiceRefFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceRefToJson(this);
}

/// The tenant application a lease was created from — nested on
/// `GET .../leases/{id}` (`?populate=TenantApplication,...`). Only the
/// financial-terms fields the lease detail screen's "Financial Terms" card
/// needs (mirrors the web lease detail page, which reads these off
/// `lease.tenant_application` rather than the lease itself).
@JsonSerializable()
class TenantApplicationModel {
  final String id;
  final String code;
  @JsonKey(name: 'rent_fee')
  final int? rentFee;
  @JsonKey(name: 'rent_fee_currency')
  final String? rentFeeCurrency;
  @JsonKey(name: 'payment_frequency')
  final String? paymentFrequency;
  @JsonKey(name: 'initial_deposit_fee')
  final int? initialDepositFee;
  @JsonKey(name: 'security_deposit_fee')
  final int? securityDepositFee;
  @JsonKey(name: 'application_payment_invoice')
  final InvoiceRef? applicationPaymentInvoice;

  TenantApplicationModel({
    required this.id,
    required this.code,
    this.rentFee,
    this.rentFeeCurrency,
    this.paymentFrequency,
    this.initialDepositFee,
    this.securityDepositFee,
    this.applicationPaymentInvoice,
  });

  factory TenantApplicationModel.fromJson(Map<String, dynamic> json) =>
      _$TenantApplicationModelFromJson(json);

  Map<String, dynamic> toJson() => _$TenantApplicationModelToJson(this);
}
