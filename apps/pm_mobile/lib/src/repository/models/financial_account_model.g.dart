// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'financial_account_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FinancialAccountModel _$FinancialAccountModelFromJson(
        Map<String, dynamic> json) =>
    FinancialAccountModel(
      id: json['id'] as String,
      currency: json['currency'] as String,
      rentBillingCadence: json['rent_billing_cadence'] as String,
      rentBillingInterval: (json['rent_billing_interval'] as num).toInt(),
      autoIssueDaysBefore: (json['auto_issue_days_before'] as num).toInt(),
      status: json['status'] as String,
      tenantId: json['tenant_id'] as String?,
    );

Map<String, dynamic> _$FinancialAccountModelToJson(
        FinancialAccountModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'currency': instance.currency,
      'rent_billing_cadence': instance.rentBillingCadence,
      'rent_billing_interval': instance.rentBillingInterval,
      'auto_issue_days_before': instance.autoIssueDaysBefore,
      'status': instance.status,
      'tenant_id': instance.tenantId,
    };

ChargeModel _$ChargeModelFromJson(Map<String, dynamic> json) => ChargeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      amount: (json['amount'] as num).toInt(),
      currency: json['currency'] as String,
      dueDate: json['due_date'] as String,
      invoicedAmount: (json['invoiced_amount'] as num).toInt(),
      settledAmount: (json['settled_amount'] as num).toInt(),
      outstandingAmount: (json['outstanding_amount'] as num).toInt(),
      status: json['status'] as String,
      voidedAt: json['voided_at'] as String?,
      voidedReason: json['voided_reason'] as String?,
      leaseId: json['lease_id'] as String?,
      reversesChargeInstanceId: json['reverses_charge_instance_id'] as String?,
    );

Map<String, dynamic> _$ChargeModelToJson(ChargeModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'category': instance.category,
      'amount': instance.amount,
      'currency': instance.currency,
      'due_date': instance.dueDate,
      'invoiced_amount': instance.invoicedAmount,
      'settled_amount': instance.settledAmount,
      'outstanding_amount': instance.outstandingAmount,
      'status': instance.status,
      'voided_at': instance.voidedAt,
      'voided_reason': instance.voidedReason,
      'lease_id': instance.leaseId,
      'reverses_charge_instance_id': instance.reversesChargeInstanceId,
    };

FinancialAccountDetailModel _$FinancialAccountDetailModelFromJson(
        Map<String, dynamic> json) =>
    FinancialAccountDetailModel(
      account: FinancialAccountModel.fromJson(
          json['account'] as Map<String, dynamic>),
      charges: (json['charges'] as List<dynamic>)
          .map((e) => ChargeModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalCharged: (json['total_charged'] as num).toInt(),
      totalSettled: (json['total_settled'] as num).toInt(),
      outstandingAmount: (json['outstanding_amount'] as num).toInt(),
      availableCredit: (json['available_credit'] as num).toInt(),
    );

Map<String, dynamic> _$FinancialAccountDetailModelToJson(
        FinancialAccountDetailModel instance) =>
    <String, dynamic>{
      'account': instance.account,
      'charges': instance.charges,
      'total_charged': instance.totalCharged,
      'total_settled': instance.totalSettled,
      'outstanding_amount': instance.outstandingAmount,
      'available_credit': instance.availableCredit,
    };
