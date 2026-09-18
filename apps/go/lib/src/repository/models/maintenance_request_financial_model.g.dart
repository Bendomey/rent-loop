// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_request_financial_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceRequestFinancialModel _$MaintenanceRequestFinancialModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceRequestFinancialModel(
      id: json['id'] as String,
      maintenanceRequestId: json['maintenance_request_id'] as String?,
      description: json['description'] as String?,
      amount: _amountFromJson(json['amount']),
      currency: json['currency'] as String?,
      status: json['status'] as String?,
      createdAt: json['created_at'] as String?,
    );
