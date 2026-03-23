import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';
import 'package:rentloop_go/src/repository/models/payment_account_model.dart';

part 'invoice.g.dart';

class InvoiceApi extends AbstractApi {
  InvoiceApi({required super.tokenManager});

  /// List invoices for a lease. Returns LEASE_RENT invoices (context_lease_id)
  /// and optionally TENANT_APPLICATION invoices (context_tenant_application_id).
  /// Sorted by due_date ascending by default.
  // TODO: add contextPayeeId filter when payee-side views are needed
  Future<List<InvoiceModel>> getLeaseInvoices(
    String leaseId, {
    String? contextTenantApplicationId,
    List<String>? statuses,
  }) async {
    final params = <String, String>{
      'order_by': 'due_date',
      'order': 'asc',
      'populate': 'LineItems',
    };
    if (contextTenantApplicationId != null) {
      params['context_tenant_application_id'] = contextTenantApplicationId;
    }

    // Build query string manually to support repeated status params
    // e.g. status=ISSUED&status=PARTIALLY_PAID
    final baseQuery = Uri(queryParameters: params).query;
    final statusQuery = statuses?.map((s) => 'status=$s').join('&');
    final query = statusQuery != null ? '$baseQuery&$statusQuery' : baseQuery;
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/invoices?$query',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final rows = json['data']['rows'] as List<dynamic>;
    return rows
        .map((e) => InvoiceModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get invoice stats grouped by status for the active lease.
  Future<Map<String, dynamic>> getInvoiceStats(String leaseId) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/invoices/stats',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return json['data'] as Map<String, dynamic>;
  }

  /// Get a single invoice with line items and payments populated.
  Future<InvoiceModel> getInvoice(String leaseId, String invoiceId) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/leases/$leaseId/invoices/$invoiceId?populate=LineItems,Payments',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return InvoiceModel.fromJson(json['data'] as Map<String, dynamic>);
  }

  /// List active payment accounts for the property manager of the given lease.
  Future<List<PaymentAccountModel>> getLeasePaymentAccounts(
    String leaseId,
  ) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/leases/$leaseId/payment-accounts',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final rows = json['data'] as List<dynamic>;
    return rows
        .map((e) => PaymentAccountModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
InvoiceApi invoiceApi(InvoiceApiRef ref) {
  return InvoiceApi(tokenManager: ref.watch(tokenManagerProvider));
}
