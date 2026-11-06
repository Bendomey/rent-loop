import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/invoice_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';

part 'bill_detail_provider.g.dart';

@riverpod
Future<InvoiceModel> billDetail(
  BillDetailRef ref,
  String propertyId,
  String id,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) throw StateError('No active workspace.');
  return ref
      .read(invoiceApiProvider)
      .getInvoice(clientId: clientId, propertyId: propertyId, id: id);
}
