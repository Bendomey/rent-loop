import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

part 'financial_account_api.g.dart';

class ComposedInvoice {
  ComposedInvoice({required this.id, required this.totalAmount});

  final String id;
  final int totalAmount;
}

class FinancialAccountApi extends AbstractApi {
  FinancialAccountApi({required super.tokenManager});

  static String _base(String clientId, String propertyId) =>
      '/api/v1/admin/clients/$clientId/properties/$propertyId';

  Map<String, dynamic> _data(String body) =>
      (jsonDecode(body) as Map<String, dynamic>)['data']
          as Map<String, dynamic>;

  Future<FinancialAccountDetailModel> getAccount({
    required String clientId,
    required String propertyId,
    required String accountId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '${_base(clientId, propertyId)}/financial-accounts/$accountId'
          '?include_voided=true',
    );
    return FinancialAccountDetailModel.fromJson(_data(response.body));
  }

  Future<void> addCharge({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String name,
    required String category,
    required int amount,
    required String currency,
    required DateTime dueDate,
    String? reversesChargeInstanceId,
  }) async {
    await execute(
      method: 'POST',
      path:
          '${_base(clientId, propertyId)}/financial-accounts/$accountId/charges',
      body: {
        'name': name,
        'category': category,
        'amount': amount,
        'currency': currency,
        'due_date': dueDate.toUtc().toIso8601String(),
        if (reversesChargeInstanceId != null)
          'reverses_charge_instance_id': reversesChargeInstanceId,
      },
    );
  }

  Future<void> voidCharge({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String chargeId,
    required String reason,
  }) async {
    await execute(
      method: 'PATCH',
      path:
          '${_base(clientId, propertyId)}/financial-accounts/$accountId'
          '/charges/$chargeId/void',
      body: {'reason': reason},
    );
  }

  Future<void> updateBillingPolicy({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String cadence,
    int? interval,
    required int autoIssueDaysBefore,
  }) async {
    await execute(
      method: 'PATCH',
      path:
          '${_base(clientId, propertyId)}/financial-accounts/$accountId'
          '/billing-policy',
      body: {
        'cadence': cadence,
        if (interval != null) 'interval': interval,
        'auto_issue_days_before': autoIssueDaysBefore,
      },
    );
  }

  Future<ComposedInvoice> composeInvoice({
    required String clientId,
    required String propertyId,
    required String accountId,
    required List<({String chargeId, int amount})> claims,
  }) async {
    final response = await execute(
      method: 'POST',
      path:
          '${_base(clientId, propertyId)}/financial-accounts/$accountId'
          '/invoices:compose',
      body: {
        'claims': [
          for (final c in claims)
            {'charge_instance_id': c.chargeId, 'amount': c.amount},
        ],
        'issue': true,
      },
    );
    final data = _data(response.body);
    return ComposedInvoice(
      id: data['id'] as String,
      totalAmount: (data['total_amount'] as num).toInt(),
    );
  }

  Future<void> payInvoice({
    required String clientId,
    required String propertyId,
    required String invoiceId,
    required String paymentAccountId,
    required int amount,
    required String provider,
    String? reference,
  }) async {
    await execute(
      method: 'POST',
      path: '${_base(clientId, propertyId)}/invoices/$invoiceId/pay',
      body: {
        'payment_account_id': paymentAccountId,
        'amount': amount,
        'provider': provider,
        if (reference != null) 'reference': reference,
      },
    );
  }
}

@riverpod
FinancialAccountApi financialAccountApi(FinancialAccountApiRef ref) =>
    FinancialAccountApi(tokenManager: ref.watch(tokenManagerProvider));
