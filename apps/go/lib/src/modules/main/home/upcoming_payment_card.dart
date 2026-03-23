import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';
import 'package:rentloop_go/src/repository/providers/invoices_provider.dart';

class UpcomingPaymentCard extends ConsumerWidget {
  const UpcomingPaymentCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoiceAsync = ref.watch(nextOutstandingInvoiceProvider);

    if (!invoiceAsync.hasValue && invoiceAsync.isLoading) {
      return const SizedBox.shrink();
    }

    final invoice = invoiceAsync.valueOrNull;
    if (invoice == null) return const SizedBox.shrink();

    return _InvoicePreview(invoice: invoice);
  }
}

class _InvoicePreview extends StatelessWidget {
  final InvoiceModel invoice;
  const _InvoicePreview({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final days = invoice.daysUntilDue;
    final (bannerColor, bannerLabel) = _dueBannerStyle(days);
    final amount = MoneyLib.formatPesewas(invoice.totalAmount);

    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade100, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Upcoming Payment',
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                fontSize: 17,
                fontFamily: "Shantell",
              ),
            ),
            const SizedBox(height: 10),
            Card(
              elevation: 0,
              color: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: BorderSide(color: Colors.grey.shade200, width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Due date severity banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: bannerColor.withValues(alpha: 0.12),
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8),
                      ),
                    ),
                    child: Text(
                      bannerLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: bannerColor,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 12,
                      horizontal: 10,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          amount,
                          style: Theme.of(context).textTheme.displaySmall!
                              .copyWith(fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                            color: _statusColor(
                              invoice.status,
                            ).withValues(alpha: 0.12),
                          ),
                          child: Text(
                            _contextLabel(invoice.contextType),
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              color: _statusColor(invoice.status),
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Divider(color: Colors.grey.shade100, height: 0),
                  if (invoice.dueDate != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.calendar_today_outlined,
                            size: 16,
                            color: Colors.grey.shade500,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Due ${DateFormat('MMM d, yyyy').format(invoice.dueDateParsed!)}',
                            style: Theme.of(context).textTheme.bodySmall!
                                .copyWith(color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => context.push('/payments/${invoice.id}'),
                child: const Text('View Details'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  (Color, String) _dueBannerStyle(int? days) {
    if (days == null) return (Colors.grey, 'No due date set');
    if (days < 0) {
      return (
        Colors.red.shade700,
        'Overdue by ${-days} day${-days == 1 ? '' : 's'}',
      );
    }
    if (days == 0) return (Colors.red.shade700, 'Due today');
    if (days <= 3) {
      return (Colors.red.shade600, 'Due in $days day${days == 1 ? '' : 's'}');
    }
    if (days <= 7) return (Colors.orange.shade700, 'Due in $days days');
    return (Colors.green.shade700, 'Due in $days days');
  }

  Color _statusColor(String status) {
    return switch (status) {
      'PARTIALLY_PAID' => Colors.orange.shade700,
      'PAID' => Colors.green.shade700,
      _ => Colors.red.shade700,
    };
  }

  String _contextLabel(String contextType) {
    return switch (contextType) {
      'LEASE_RENT' => 'Rent',
      'TENANT_APPLICATION' => 'Application',
      'MAINTENANCE' => 'Maintenance',
      'GENERAL_EXPENSE' => 'Expense',
      _ => contextType,
    };
  }
}
