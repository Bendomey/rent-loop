import 'package:rentloop_go/src/api/invoice.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';

part 'invoices_provider.g.dart';

/// Fetches all invoices for the currently active lease.
/// Includes both LEASE_RENT (via lease_id) and TENANT_APPLICATION
/// (via the lease's linked tenant application) invoices.
@riverpod
Future<List<InvoiceModel>> invoices(InvoicesRef ref) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return [];

  return ref
      .read(invoiceApiProvider)
      .getLeaseInvoices(
        activeLease.id,
        contextTenantApplicationId: activeLease.tenantApplication?.id,
      );
}

/// Fetches the next outstanding invoice (ISSUED or PARTIALLY_PAID) for the
/// home screen upcoming payment card, ordered by due date ascending.
/// Returns null if there are no outstanding invoices.
@riverpod
Future<InvoiceModel?> nextOutstandingInvoice(
  NextOutstandingInvoiceRef ref,
) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return null;

  final invoices = await ref
      .read(invoiceApiProvider)
      .getLeaseInvoices(
        activeLease.id,
        contextTenantApplicationId: activeLease.tenantApplication?.id,
        statuses: ['ISSUED', 'PARTIALLY_PAID'],
      );

  return invoices.firstOrNull;
}

/// Fetches invoice stats (counts + amounts grouped by status) for the active lease.
/// Used by the home screen payment summary card.
@Riverpod(keepAlive: true)
Future<Map<String, dynamic>> invoiceStats(InvoiceStatsRef ref) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return {};

  return ref.read(invoiceApiProvider).getInvoiceStats(activeLease.id);
}

/// Fetches a single invoice with full line items and payments detail.
@riverpod
Future<InvoiceModel> invoiceDetail(
  InvoiceDetailRef ref,
  String leaseId,
  String invoiceId,
) async {
  return ref.read(invoiceApiProvider).getInvoice(leaseId, invoiceId);
}
