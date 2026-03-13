import 'package:json_annotation/json_annotation.dart';

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
  @JsonKey(name: 'total_amount')
  final int totalAmount;
  @JsonKey(name: 'sub_total')
  final int subTotal;
  final String currency;
  @JsonKey(name: 'due_date')
  final String? dueDate;
  @JsonKey(name: 'paid_at')
  final String? paidAt;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'line_items')
  final List<InvoiceLineItemModel>? lineItems;

  InvoiceModel({
    required this.id,
    required this.code,
    required this.status,
    required this.contextType,
    required this.totalAmount,
    required this.subTotal,
    required this.currency,
    this.dueDate,
    this.paidAt,
    this.createdAt,
    this.lineItems,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceModelFromJson(json);

  Map<String, dynamic> toJson() => _$InvoiceModelToJson(this);
}
