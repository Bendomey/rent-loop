import 'package:json_annotation/json_annotation.dart';
import 'payment_model.dart';

part 'invoice_model.g.dart';

@JsonSerializable()
class InvoiceLineItemModel {
  final String label;
  final String category;
  @JsonKey(name: 'unit_amount')
  final int unitAmount;
  @JsonKey(name: 'total_amount')
  final int totalAmount;
  final int quantity;
  final String currency;

  InvoiceLineItemModel({
    required this.label,
    required this.category,
    required this.unitAmount,
    required this.totalAmount,
    required this.quantity,
    required this.currency,
  });

  factory InvoiceLineItemModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceLineItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceLineItemModelToJson(this);
}

@JsonSerializable(explicitToJson: true)
class InvoiceModel {
  final String id;
  final String code;
  final String status;
  @JsonKey(name: 'context_type')
  final String contextType;
  @JsonKey(name: 'context_lease_id')
  final String? contextLeaseId;
  @JsonKey(name: 'context_tenant_application_id')
  final String? contextTenantApplicationId;
  @JsonKey(name: 'context_maintenance_request_id')
  final String? contextMaintenanceRequestId;
  @JsonKey(name: 'total_amount')
  final int totalAmount;
  @JsonKey(name: 'sub_total')
  final int subTotal;
  final String currency;
  @JsonKey(name: 'due_date')
  final String? dueDate;
  @JsonKey(name: 'issued_at')
  final String? issuedAt;
  @JsonKey(name: 'paid_at')
  final String? paidAt;
  @JsonKey(name: 'voided_at')
  final String? voidedAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'allowed_payment_rails')
  final List<String>? allowedPaymentRails;
  @JsonKey(name: 'line_items')
  final List<InvoiceLineItemModel>? lineItems;
  final List<PaymentModel>? payments;

  InvoiceModel({
    required this.id,
    required this.code,
    required this.status,
    required this.contextType,
    required this.totalAmount,
    required this.subTotal,
    required this.currency,
    this.contextLeaseId,
    this.contextTenantApplicationId,
    this.contextMaintenanceRequestId,
    this.dueDate,
    this.issuedAt,
    this.paidAt,
    this.voidedAt,
    this.createdAt,
    this.allowedPaymentRails,
    this.lineItems,
    this.payments,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceModelFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceModelToJson(this);

  /// Returns true if the invoice still requires (partial) payment.
  bool get isOutstanding => status == 'ISSUED' || status == 'PARTIALLY_PAID';

  /// Parses dueDate to a local DateTime, or null if not set.
  DateTime? get dueDateParsed =>
      dueDate != null ? DateTime.tryParse(dueDate!)?.toLocal() : null;

  /// Days until due date from now. Negative means overdue.
  int? get daysUntilDue {
    final due = dueDateParsed;
    if (due == null) return null;
    return due.difference(DateTime.now()).inDays;
  }
}
