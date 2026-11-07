import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/invoice_api.dart';
import 'package:rentloop_manager/src/lib/secure_storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

const _meta = {
  'total': 0,
  'page': 1,
  'page_size': 20,
  'has_next_page': false,
  'has_previous_page': false,
};

Map<String, dynamic> _invoiceJson() => {
  'id': 'i1',
  'code': 'INV-2024-0001',
  'status': 'PARTIALLY_PAID',
  'total_amount': 100000,
  'currency': 'GHS',
  'due_date': '2024-07-01T00:00:00Z',
  'issued_at': '2024-06-15T00:00:00Z',
  'paid_at': null,
  'property_id': 'p1',
  'property': {'id': 'p1', 'name': 'Palm Court'},
  'payer_lease_id': 'l1',
  'payer_lease': {
    'id': 'l1',
    'tenant': {
      'id': 't1',
      'first_name': 'Ama',
      'last_name': 'Mensah',
      'phone': '+233200000000',
      'email': null,
    },
    'unit': {
      'id': 'u1',
      'name': 'Unit 101',
      'property_block': {'name': 'Block A'},
    },
  },
  'financial_account_id': 'fa1',
  'context_type': 'LEASE_RENT',
  'line_items': [
    {
      'id': 'li1',
      'label': 'January Rent',
      'category': 'RENT',
      'quantity': 1,
      'unit_amount': 100000,
      'total_amount': 100000,
    },
  ],
  'payments': [
    {
      'id': 'pay1',
      'amount': 40000,
      'status': 'PENDING',
      'rail': 'OFFLINE',
      'provider': 'CASH',
      'reference': null,
      'created_at': '2024-06-20T10:00:00Z',
      'successful_at': null,
      'failed_at': null,
      'metadata': {
        'initiated_by': {'client_user_id': 'cu1'},
      },
    },
    {
      'id': 'pay2',
      'amount': 20000,
      'status': 'PENDING',
      'rail': 'OFFLINE',
      'provider': 'CASH',
      'reference': 'R-1',
      'created_at': '2024-06-21T10:00:00Z',
      'successful_at': null,
      'failed_at': null,
      'metadata': {
        'payment_account': {'id': 'pa1'},
      },
    },
    {
      'id': 'pay3',
      'amount': 5000,
      'status': 'SUCCESSFUL',
      'rail': 'OFFLINE',
      'provider': 'CASH',
      'created_at': '2024-06-22T10:00:00Z',
      'successful_at': '2024-06-22T10:00:00Z',
    },
  ],
};

class _RecordingApi extends InvoiceApi {
  _RecordingApi() : super(tokenManager: TokenManager(SecureStorage()));

  final List<String> paths = [];
  final List<String> methods = [];
  final List<Map<String, dynamic>?> bodies = [];

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
    if (method == 'GET' && !path.contains('/invoices?')) {
      return http.Response(jsonEncode({'data': _invoiceJson()}), 200);
    }
    return http.Response(
      jsonEncode({
        'data': {
          'rows': [_invoiceJson()],
          'meta': _meta,
        },
      }),
      200,
    );
  }
}

class _RecordingFinancialApi extends FinancialAccountApi {
  _RecordingFinancialApi() : super(tokenManager: TokenManager(SecureStorage()));

  Map<String, dynamic>? body;

  @override
  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    this.body = body;
    return http.Response('{}', 200);
  }
}

void main() {
  test('lists owing bills across properties', () async {
    final api = _RecordingApi();
    final page = await api.listInvoices(
      clientId: 'c1',
      statuses: const ['ISSUED', 'PARTIALLY_PAID'],
      propertyIds: const ['p1', 'p2'],
      orderBy: 'invoices.due_date',
      order: 'asc',
      page: 2,
    );

    final uri = Uri.parse('https://x${api.paths.single}');
    expect(uri.path, '/api/v1/admin/clients/c1/invoices');
    final q = uri.queryParametersAll;
    expect(q['status'], ['ISSUED', 'PARTIALLY_PAID']);
    expect(q['property_id'], ['p1', 'p2']);
    expect(q['payee_type'], ['PROPERTY_OWNER']);
    expect(q['order_by'], ['invoices.due_date']);
    expect(q['order'], ['asc']);
    expect(q['page'], ['2']);
    expect(q['page_size'], ['20']);
    expect(q['populate'], [
      'Property,PayerLease.Tenant,PayerLease.Unit,Payments,'
          'FinancialAccount.TenantApplication',
    ]);
    expect(q.containsKey('query'), isFalse);
    expect(page.rows.single.code, 'INV-2024-0001');
    expect(page.meta.pageSize, 20);
  });

  test('search uses query on code', () async {
    final api = _RecordingApi();
    await api.listInvoices(
      clientId: 'c1',
      statuses: const ['PAID'],
      orderBy: 'invoices.paid_at',
      order: 'desc',
      search: 'INV-9',
    );
    final q = Uri.parse('https://x${api.paths.single}').queryParametersAll;
    expect(q['query'], ['INV-9']);
    expect(q['search_fields'], ['code']);
    expect(q.containsKey('property_id'), isFalse);
  });

  test('detail populate never includes the tenant application', () async {
    final api = _RecordingApi();
    final invoice = await api.getInvoice(
      clientId: 'c1',
      propertyId: 'p1',
      id: 'i1',
    );
    final uri = Uri.parse('https://x${api.paths.single}');
    expect(uri.path, '/api/v1/admin/clients/c1/properties/p1/invoices/i1');
    final populate = uri.queryParameters['populate']!;
    expect(
      populate,
      'Payments,LineItems,Property,PayerClient,'
      'FinancialAccount.TenantApplication,'
      'PayerLease.Tenant,PayerLease.Unit.PropertyBlock',
    );
    expect(populate, isNot(contains('ContextTenantApplication')));
    expect(invoice.lineItems.single.label, 'January Rent');
  });

  test('decline sends is_successful false with the reason', () async {
    final api = _RecordingApi();
    await api.verifyPayment(
      clientId: 'c1',
      propertyId: 'p1',
      paymentId: 'pay1',
      isSuccessful: false,
      reason: 'Never arrived',
    );
    expect(api.methods.single, 'PATCH');
    expect(
      api.paths.single,
      '/api/v1/admin/clients/c1/properties/p1/payments/pay1/verify',
    );
    expect(api.bodies.single, {
      'is_successful': false,
      'metadata': {
        'offline_response': {'reason': 'Never arrived'},
      },
    });
  });

  test('confirm omits metadata', () async {
    final api = _RecordingApi();
    await api.verifyPayment(
      clientId: 'c1',
      propertyId: 'p1',
      paymentId: 'pay1',
      isSuccessful: true,
    );
    expect(api.bodies.single, {'is_successful': true});
  });

  group('payInvoice reference', () {
    test('is sent when given', () async {
      final api = _RecordingFinancialApi();
      await api.payInvoice(
        clientId: 'c1',
        propertyId: 'p1',
        invoiceId: 'i1',
        paymentAccountId: 'pa1',
        amount: 100,
        provider: 'CASH',
        reference: 'RCP-1',
      );
      expect(api.body!['reference'], 'RCP-1');
    });

    test('is omitted otherwise', () async {
      final api = _RecordingFinancialApi();
      await api.payInvoice(
        clientId: 'c1',
        propertyId: 'p1',
        invoiceId: 'i1',
        paymentAccountId: 'pa1',
        amount: 100,
        provider: 'CASH',
      );
      expect(api.body!.containsKey('reference'), isFalse);
    });
  });

  test('parses the invoice and flags tenant-reported payments', () {
    final invoice = InvoiceModel.fromJson(_invoiceJson());
    expect(invoice.totalAmount, 100000);
    expect(invoice.dueDate, '2024-07-01T00:00:00Z');
    expect(invoice.paidAt, isNull);
    expect(invoice.property!.name, 'Palm Court');
    final lease = invoice.payerLease!;
    expect(lease.tenant!.firstName, 'Ama');
    expect(lease.tenant!.email, isNull);
    expect(lease.unit!.name, 'Unit 101');
    expect(lease.unit!.propertyBlock!.name, 'Block A');
    expect(invoice.lineItems.single.totalAmount, 100000);

    final payments = invoice.payments;
    expect(payments[0].reportedByTenant, isFalse);
    expect(payments[1].reportedByTenant, isTrue);
    expect(payments[2].reportedByTenant, isTrue);
    expect(payments[1].reference, 'R-1');
    expect(payments[2].metadata, isNull);
  });

  test('tolerates missing optional collections', () {
    final invoice = InvoiceModel.fromJson({
      'id': 'i2',
      'code': 'INV-2',
      'status': 'ISSUED',
      'total_amount': 5,
      'currency': 'GHS',
      'context_type': 'LEASE_RENT',
    });
    expect(invoice.lineItems, isEmpty);
    expect(invoice.payments, isEmpty);
    expect(invoice.payerLease, isNull);
  });
}
