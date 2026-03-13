// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'invoice_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InvoiceLineItemModel _$InvoiceLineItemModelFromJson(
  Map<String, dynamic> json,
) => InvoiceLineItemModel(
  label: json['label'] as String,
  category: json['category'] as String,
  unitAmount: (json['unit_amount'] as num).toInt(),
  totalAmount: (json['total_amount'] as num).toInt(),
  quantity: (json['quantity'] as num).toInt(),
  currency: json['currency'] as String,
);

Map<String, dynamic> _$InvoiceLineItemModelToJson(
  InvoiceLineItemModel instance,
) => <String, dynamic>{
  'label': instance.label,
  'category': instance.category,
  'unit_amount': instance.unitAmount,
  'total_amount': instance.totalAmount,
  'quantity': instance.quantity,
  'currency': instance.currency,
};

InvoiceModel _$InvoiceModelFromJson(Map<String, dynamic> json) => InvoiceModel(
  id: json['id'] as String,
  code: json['code'] as String,
  status: json['status'] as String,
  contextType: json['context_type'] as String,
  totalAmount: (json['total_amount'] as num).toInt(),
  subTotal: (json['sub_total'] as num).toInt(),
  currency: json['currency'] as String,
  dueDate: json['due_date'] as String?,
  paidAt: json['paid_at'] as String?,
  createdAt: json['created_at'] as String?,
  lineItems: (json['line_items'] as List<dynamic>?)
      ?.map((e) => InvoiceLineItemModel.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$InvoiceModelToJson(InvoiceModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'code': instance.code,
      'status': instance.status,
      'context_type': instance.contextType,
      'total_amount': instance.totalAmount,
      'sub_total': instance.subTotal,
      'currency': instance.currency,
      'due_date': instance.dueDate,
      'paid_at': instance.paidAt,
      'created_at': instance.createdAt,
      'line_items': instance.lineItems?.map((e) => e.toJson()).toList(),
    };
