import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

part 'invoice_api.g.dart';

class InvoiceApi extends AbstractApi {
  InvoiceApi({required super.tokenManager});

  static const _listPopulate =
      'Property,PayerLease.Tenant,PayerLease.Unit,Payments,'
      'FinancialAccount.TenantApplication';

  // ContextTenantApplication is deliberately absent: populating it 500s.
  static const _detailPopulate =
      'Payments,LineItems,Property,PayerClient,'
      'FinancialAccount.TenantApplication,'
      'PayerLease.Tenant,PayerLease.Unit.PropertyBlock';

  static String _client(String clientId) => '/api/v1/admin/clients/$clientId';

  Future<InvoicesPage> listInvoices({
    required String clientId,
    required List<String> statuses,
    List<String>? propertyIds,
    String payeeType = 'PROPERTY_OWNER',
    required String orderBy,
    required String order,
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    final queryString = Uri(
      queryParameters: {
        'page': '$page',
        'page_size': '$pageSize',
        'order_by': orderBy,
        'order': order,
        'populate': _listPopulate,
        'payee_type': payeeType,
        'status': statuses,
        if (propertyIds != null && propertyIds.isNotEmpty)
          'property_id': propertyIds,
        if (search != null && search.isNotEmpty) ...{
          'query': search,
          'search_fields': 'code',
        },
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '${_client(clientId)}/invoices?$queryString',
    );
    final data =
        (jsonDecode(response.body) as Map<String, dynamic>)['data']
            as Map<String, dynamic>;
    return InvoicesPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => InvoiceModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  Future<InvoiceModel> getInvoice({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '${_client(clientId)}/properties/$propertyId/invoices/$id'
          '?${Uri(queryParameters: {'populate': _detailPopulate}).query}',
    );
    return InvoiceModel.fromJson(
      (jsonDecode(response.body) as Map<String, dynamic>)['data']
          as Map<String, dynamic>,
    );
  }

  Future<void> verifyPayment({
    required String clientId,
    required String propertyId,
    required String paymentId,
    required bool isSuccessful,
    String? reason,
  }) async {
    await execute(
      method: 'PATCH',
      path:
          '${_client(clientId)}/properties/$propertyId/payments/$paymentId'
          '/verify',
      body: {
        'is_successful': isSuccessful,
        if (reason != null)
          'metadata': {
            'offline_response': {'reason': reason},
          },
      },
    );
  }
}

@riverpod
InvoiceApi invoiceApi(InvoiceApiRef ref) =>
    InvoiceApi(tokenManager: ref.watch(tokenManagerProvider));
