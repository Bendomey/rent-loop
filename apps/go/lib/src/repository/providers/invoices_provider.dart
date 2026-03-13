import 'package:rentloop_go/src/api/invoice.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';

part 'invoices_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<InvoiceModel>> invoices(InvoicesRef ref) async {
  final currentUser = ref.watch(currentUserNotifierProvider);
  return ref
      .read(invoiceApiProvider)
      .getInvoices(tenantId: currentUser?.tenantId);
}
