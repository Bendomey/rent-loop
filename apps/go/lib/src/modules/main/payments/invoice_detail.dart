import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/modules/main/payments/offline_payment_sheet.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';
import 'package:rentloop_go/src/repository/models/payment_model.dart';
import 'package:rentloop_go/src/repository/providers/invoices_provider.dart';

class InvoiceDetailScreen extends ConsumerWidget {
  final String invoiceId;
  const InvoiceDetailScreen({super.key, required this.invoiceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeLease = ref.watch(currentLeaseNotifierProvider);
    if (activeLease == null) {
      return const Scaffold(body: Center(child: Text('No active lease')));
    }

    final invoiceAsync = ref.watch(
      invoiceDetailProvider(activeLease.id, invoiceId),
    );

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Invoice',
          style: Theme.of(
            context,
          ).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      body: Builder(
        builder: (_) {
          if (!invoiceAsync.hasValue && invoiceAsync.isLoading) {
            return _InvoiceDetailSkeleton();
          }
          if (invoiceAsync.hasError && !invoiceAsync.hasValue) {
            return _buildError(context, ref, activeLease.id);
          }
          final invoice = invoiceAsync.value!;
          return _buildContent(context, ref, invoice, activeLease.id);
        },
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    InvoiceModel invoice,
    String leaseId,
  ) {
    return RefreshIndicator(
      onRefresh: () =>
          ref.refresh(invoiceDetailProvider(leaseId, invoiceId).future),
      child: Stack(
        children: [
          SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _HeaderCard(invoice: invoice),
                const SizedBox(height: 12),
                _DueDateBanner(invoice: invoice),
                const SizedBox(height: 12),
                _ContextSection(invoice: invoice),
                const SizedBox(height: 12),
                _LineItemsSection(invoice: invoice),
                const SizedBox(height: 12),
                _PaymentsSection(invoice: invoice),
              ],
            ),
          ),
          if (invoice.isOutstanding)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _PayButton(invoice: invoice, leaseId: leaseId),
            ),
        ],
      ),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref, String leaseId) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'Failed to load invoice',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  ref.invalidate(invoiceDetailProvider(leaseId, invoiceId)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderCard extends StatelessWidget {
  final InvoiceModel invoice;
  const _HeaderCard({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final (statusColor, statusLabel) = _statusStyle(invoice.status);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                invoice.code,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            MoneyLib.formatPesewas(invoice.totalAmount),
            style: Theme.of(
              context,
            ).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }

  (Color, String) _statusStyle(String status) {
    return switch (status) {
      'PARTIALLY_PAID' => (Colors.orange.shade700, 'Partially Paid'),
      'PAID' => (Colors.green.shade700, 'Paid'),
      'VOID' => (Colors.grey.shade500, 'Void'),
      _ => (Colors.red.shade700, 'Unpaid'),
    };
  }
}

class _DueDateBanner extends StatelessWidget {
  final InvoiceModel invoice;
  const _DueDateBanner({required this.invoice});

  @override
  Widget build(BuildContext context) {
    if (!invoice.isOutstanding) return const SizedBox.shrink();
    final days = invoice.daysUntilDue;
    if (days == null) return const SizedBox.shrink();

    final (color, label) = _bannerStyle(days);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.calendar_today_outlined, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: color,
                    fontSize: 13,
                  ),
                ),
                if (invoice.dueDateParsed != null)
                  Text(
                    DateFormat(
                      'EEEE, MMM d, yyyy',
                    ).format(invoice.dueDateParsed!),
                    style: TextStyle(
                      fontSize: 12,
                      color: color.withValues(alpha: 0.8),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color, String) _bannerStyle(int days) {
    if (days < 0)
      return (
        Colors.red.shade700,
        'Overdue by ${-days} day${-days == 1 ? '' : 's'}',
      );
    if (days == 0) return (Colors.red.shade700, 'Due today');
    if (days <= 3)
      return (Colors.red.shade600, 'Due in $days day${days == 1 ? '' : 's'}');
    if (days <= 7) return (Colors.orange.shade700, 'Due in $days days');
    return (Colors.green.shade700, 'Due in $days days');
  }
}

class _ContextSection extends StatelessWidget {
  final InvoiceModel invoice;
  const _ContextSection({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final (icon, label, onTap) = _resolveContext(context, invoice);

    return _Card(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 18, color: Colors.grey.shade600),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Invoice For',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          if (onTap != null)
            GestureDetector(
              onTap: onTap,
              child: Icon(
                Icons.open_in_new,
                size: 18,
                color: Theme.of(context).primaryColor,
              ),
            ),
        ],
      ),
    );
  }

  (IconData, String, VoidCallback?) _resolveContext(
    BuildContext context,
    InvoiceModel invoice,
  ) {
    switch (invoice.contextType) {
      case 'LEASE_RENT':
        return (
          Icons.home_outlined,
          'Rent',
          () => context.push('/more/lease-details'),
        );
      case 'TENANT_APPLICATION':
        final appId = invoice.contextTenantApplicationId;
        return (
          Icons.assignment_outlined,
          'Tenant Application',
          appId != null
              ? () => context.push('/more/tenant-application/$appId')
              : null,
        );
      case 'MAINTENANCE':
        return (Icons.build_outlined, 'Maintenance Request', null);
      case 'MAINTENANCE_EXPENSE':
        return (Icons.receipt_long_outlined, 'Maintenance Expense', null);
      case 'GENERAL_EXPENSE':
        return (Icons.receipt_outlined, 'General Expense', null);
      default:
        return (Icons.description_outlined, invoice.contextType, null);
    }
  }
}

class _LineItemsSection extends StatelessWidget {
  final InvoiceModel invoice;
  const _LineItemsSection({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final items = invoice.lineItems ?? [];
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Line Items',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          if (items.isEmpty)
            Text(
              'No line items',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            )
          else
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.label,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: Colors.grey.shade500,
                            ),
                          ),
                          // Text(
                          //   item.quantity == 1
                          //       ? _formatCategory(item.category)
                          //       : '${_formatCategory(item.category)} × ${item.quantity}',
                          //   style: TextStyle(
                          //     fontSize: 11,
                          //     color: Colors.grey.shade500,
                          //   ),
                          // ),
                        ],
                      ),
                    ),
                    Text(
                      MoneyLib.formatPesewas(item.totalAmount),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (items.isNotEmpty) ...[
            Divider(color: Colors.grey.shade100),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                Text(
                  MoneyLib.formatPesewas(invoice.totalAmount),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatCategory(String category) {
    return category
        .split('_')
        .map(
          (w) => w.isEmpty
              ? ''
              : '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}',
        )
        .join(' ');
  }
}

class _PaymentsSection extends StatelessWidget {
  final InvoiceModel invoice;
  const _PaymentsSection({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final payments = invoice.payments ?? [];
    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payments (${payments.length})',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          if (payments.isEmpty)
            Text(
              'No payments recorded yet',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            )
          else
            ...payments.map((p) => _PaymentRow(payment: p)),
        ],
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final PaymentModel payment;
  const _PaymentRow({required this.payment});

  @override
  Widget build(BuildContext context) {
    final (statusColor, statusLabel) = _paymentStatusStyle(payment.status);
    final dateStr = payment.createdAt != null
        ? DateFormat(
            'MMM d, yyyy',
          ).format(DateTime.parse(payment.createdAt!).toLocal())
        : '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.payment_outlined, size: 16, color: statusColor),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _railLabel(payment.rail, payment.provider),
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      MoneyLib.formatPesewas(payment.amount),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: statusColor,
                        ),
                      ),
                    ),
                    if (dateStr.isNotEmpty)
                      Text(
                        dateStr,
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                  ],
                ),
                if (payment.reference != null)
                  Text(
                    'Ref: ${payment.reference}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color, String) _paymentStatusStyle(String status) {
    return switch (status) {
      'SUCCESSFUL' => (Colors.green.shade700, 'Successful'),
      'FAILED' => (Colors.red.shade700, 'Failed'),
      _ => (Colors.orange.shade700, 'Pending'),
    };
  }

  String _railLabel(String rail, String? provider) {
    if (provider != null) {
      return switch (provider) {
        'MTN' => 'MTN Momo',
        'VODAFONE' => 'Telecel Cash',
        'AIRTELTIGO' => 'AirtelTigo Money',
        'CASH' => 'Cash',
        'PAYSTACK' => 'Paystack',
        'BANK_API' => 'Bank Transfer',
        _ => provider,
      };
    }
    return switch (rail) {
      'MOMO' => 'Mobile Money',
      'BANK_TRANSFER' => 'Bank Transfer',
      'CARD' => 'Card',
      'OFFLINE' => 'Offline',
      _ => rail,
    };
  }
}

class _PayButton extends ConsumerWidget {
  final InvoiceModel invoice;
  final String leaseId;
  const _PayButton({required this.invoice, required this.leaseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      color: Colors.white,
      child: SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: () => _openPaymentSheet(context, ref),
          icon: const Icon(Icons.payment),
          label: const Text('Pay Now'),
        ),
      ),
    );
  }

  void _openPaymentSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => OfflinePaymentSheet(
        invoiceId: invoice.id,
        leaseId: leaseId,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        onSuccess: () {
          ref.invalidate(invoiceDetailProvider(leaseId, invoice.id));
          ref.invalidate(invoicesProvider);
        },
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: child,
    );
  }
}

class _InvoiceDetailSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 150,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
