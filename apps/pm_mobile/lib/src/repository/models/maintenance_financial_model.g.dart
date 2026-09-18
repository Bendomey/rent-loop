// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'maintenance_financial_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MaintenanceFinancialModel _$MaintenanceFinancialModelFromJson(
        Map<String, dynamic> json) =>
    MaintenanceFinancialModel(
      id: json['id'] as String,
      description: json['description'] as String,
      amount: json['amount'] as num,
      currency: json['currency'] as String,
      settlementType: json['settlement_type'] as String,
      status: json['status'] as String,
      isEditable: json['is_editable'] as bool,
      createdAt: json['created_at'] as String?,
    );
