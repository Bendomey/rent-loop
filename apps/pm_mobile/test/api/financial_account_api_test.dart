import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';

class _RecordingApi extends FinancialAccountApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  final List<String> paths = [];
  final List<String> methods = [];
  final List<Map<String, dynamic>?> bodies = [];
  Object? nextData;

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    paths.add(path);
    methods.add(method);
    bodies.add(body);
    return http.Response(jsonEncode({'data': nextData}), 200);
  }
}

const _base = '/api/v1/admin/clients/c1/properties/p1';

void main() {
  test('getAccount asks for voided charges and parses the detail', () async {
    final api = _RecordingApi()
      ..nextData = {
        'account': {
          'id': 'a1',
          'currency': 'GHS',
          'rent_billing_cadence': 'EVERY_N_PERIODS',
          'rent_billing_interval': 12,
          'auto_issue_days_before': 5,
          'status': 'ACTIVE',
          'tenant_id': 't1',
        },
        'charges': [
          {
            'id': 'ch1',
            'name': 'Rent',
            'category': 'RENT',
            'amount': 100000,
            'currency': 'GHS',
            'due_date': '2027-03-01T00:00:00Z',
            'invoiced_amount': 0,
            'settled_amount': 0,
            'outstanding_amount': 100000,
            'status': 'OUTSTANDING',
            'lease_id': 'l1',
          },
          {
            'id': 'ch2',
            'name': 'Refund',
            'category': 'SECURITY_DEPOSIT',
            'amount': -50000,
            'currency': 'GHS',
            'due_date': '2027-03-01T00:00:00Z',
            'invoiced_amount': 0,
            'settled_amount': 0,
            'outstanding_amount': -50000,
            'status': 'VOID',
            'voided_at': '2027-03-02T00:00:00Z',
            'voided_reason': 'Entered in error',
          },
        ],
        'total_charged': 50000,
        'total_settled': 0,
        'outstanding_amount': 50000,
        'available_credit': 0,
      };

    final detail = await api.getAccount(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
    );

    expect(api.methods.single, 'GET');
    expect(
      api.paths.single,
      '$_base/financial-accounts/a1?include_voided=true',
    );
    expect(detail.account.rentBillingInterval, 12);
    expect(detail.account.autoIssueDaysBefore, 5);
    expect(detail.account.tenantId, 't1');
    expect(detail.charges, hasLength(2));
    expect(detail.charges[0].leaseId, 'l1');
    expect(detail.charges[1].amount, -50000);
    expect(detail.charges[1].voidedReason, 'Entered in error');
    expect(detail.totalCharged, 50000);
    expect(detail.availableCredit, 0);
  });

  test('addCharge posts a UTC RFC3339 due date and no reversal key', () async {
    final api = _RecordingApi()..nextData = {'id': 'ch9'};
    await api.addCharge(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      name: 'Water',
      category: 'UTILITY',
      amount: 25000,
      currency: 'GHS',
      dueDate: DateTime(2027, 3, 1, 15),
    );

    expect(api.methods.single, 'POST');
    expect(api.paths.single, '$_base/financial-accounts/a1/charges');
    final body = api.bodies.single!;
    expect(body['name'], 'Water');
    expect(body['category'], 'UTILITY');
    expect(body['amount'], 25000);
    expect(body['currency'], 'GHS');
    expect(
      body['due_date'],
      DateTime(2027, 3, 1, 15).toUtc().toIso8601String(),
    );
    expect(body['due_date'], endsWith('Z'));
    expect(body.containsKey('reverses_charge_instance_id'), isFalse);
  });

  test('a refund carries reverses_charge_instance_id', () async {
    final api = _RecordingApi()..nextData = {'id': 'ch9'};
    await api.addCharge(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      name: 'Deposit refund',
      category: 'SECURITY_DEPOSIT',
      amount: -100000,
      currency: 'GHS',
      dueDate: DateTime.utc(2027, 3, 1),
      reversesChargeInstanceId: 'dep1',
    );

    expect(api.bodies.single!['amount'], -100000);
    expect(api.bodies.single!['reverses_charge_instance_id'], 'dep1');
  });

  test('voidCharge patches the void path with the reason', () async {
    final api = _RecordingApi()..nextData = {};
    await api.voidCharge(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      chargeId: 'ch1',
      reason: 'Entered in error',
    );

    expect(api.methods.single, 'PATCH');
    expect(api.paths.single, '$_base/financial-accounts/a1/charges/ch1/void');
    expect(api.bodies.single, {'reason': 'Entered in error'});
  });

  test('updateBillingPolicy sends cadence, interval and issue lead', () async {
    final api = _RecordingApi()..nextData = {};
    await api.updateBillingPolicy(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      cadence: 'EVERY_N_PERIODS',
      interval: 3,
      autoIssueDaysBefore: 5,
    );

    expect(api.methods.single, 'PATCH');
    expect(api.paths.single, '$_base/financial-accounts/a1/billing-policy');
    expect(api.bodies.single, {
      'cadence': 'EVERY_N_PERIODS',
      'interval': 3,
      'auto_issue_days_before': 5,
    });
  });

  test('updateBillingPolicy omits a null interval', () async {
    final api = _RecordingApi()..nextData = {};
    await api.updateBillingPolicy(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      cadence: 'MANUAL',
      autoIssueDaysBefore: 0,
    );

    expect(api.bodies.single, {
      'cadence': 'MANUAL',
      'auto_issue_days_before': 0,
    });
  });

  test('composeInvoice issues by claims and parses id and total', () async {
    final api = _RecordingApi()
      ..nextData = {'id': 'inv1', 'total_amount': 300000};
    final result = await api.composeInvoice(
      clientId: 'c1',
      propertyId: 'p1',
      accountId: 'a1',
      claims: [
        (chargeId: 'ch1', amount: 100000),
        (chargeId: 'ch2', amount: 200000),
      ],
    );

    expect(api.methods.single, 'POST');
    expect(api.paths.single, '$_base/financial-accounts/a1/invoices:compose');
    expect(api.bodies.single, {
      'claims': [
        {'charge_instance_id': 'ch1', 'amount': 100000},
        {'charge_instance_id': 'ch2', 'amount': 200000},
      ],
      'issue': true,
    });
    expect(result.id, 'inv1');
    expect(result.totalAmount, 300000);
  });

  test('payInvoice posts the payment account, amount and provider', () async {
    final api = _RecordingApi()..nextData = null;
    await api.payInvoice(
      clientId: 'c1',
      propertyId: 'p1',
      invoiceId: 'inv1',
      paymentAccountId: 'pa1',
      amount: 25000,
      provider: 'CASH',
    );

    expect(api.methods.single, 'POST');
    expect(api.paths.single, '$_base/invoices/inv1/pay');
    expect(api.bodies.single, {
      'payment_account_id': 'pa1',
      'amount': 25000,
      'provider': 'CASH',
    });
  });

  test('exposes ApiException from the base class untouched', () {
    expect(ApiException(400, '{}').statusCode, 400);
  });
}
