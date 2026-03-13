import 'dart:convert';

import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';

part 'invoice.g.dart';

class InvoiceApi extends AbstractApi {
  InvoiceApi({required super.tokenManager});

  Future<List<InvoiceModel>> getInvoices({String? tenantId}) async {
    final query = tenantId != null ? '?payer_tenant_id=$tenantId' : '';
    final response = await execute(
      method: 'GET',
      path: '/api/v1/invoices$query',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final rows = json['data']['rows'] as List<dynamic>;
    return rows
        .map((e) => InvoiceModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

@riverpod
InvoiceApi invoiceApi(InvoiceApiRef ref) {
  return InvoiceApi(tokenManager: ref.watch(tokenManagerProvider));
}
