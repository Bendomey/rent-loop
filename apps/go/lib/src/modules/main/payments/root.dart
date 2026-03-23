import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/invoice_model.dart';
import 'package:rentloop_go/src/repository/providers/invoices_provider.dart';

class PaymentsScreen extends ConsumerWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final invoicesAsync = ref.watch(invoicesProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Payments',
          style: Theme.of(
            context,
          ).textTheme.titleLarge!.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      body: Builder(
        builder: (_) {
          if (!invoicesAsync.hasValue && invoicesAsync.isLoading) {
            return _buildShimmer();
          }
          if (invoicesAsync.hasError && !invoicesAsync.hasValue) {
            return _buildError(context, ref);
          }
          return _buildContent(
            context,
            ref,
            invoicesAsync.value ?? [],
            invoicesAsync,
          );
        },
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    List<InvoiceModel> invoices,
    AsyncValue<List<InvoiceModel>> invoicesAsync,
  ) {
    final outstanding = invoices.where((i) => i.isOutstanding).toList();
    final paid = invoices.where((i) => i.status == 'PAID').toList();

    final totalOutstanding = outstanding.fold<int>(
      0,
      (sum, i) => sum + i.totalAmount,
    );
    final currency = outstanding.isNotEmpty
        ? outstanding.first.currency
        : (invoices.isNotEmpty ? invoices.first.currency : 'GHS');

    return RefreshIndicator(
      onRefresh: () => ref.refresh(invoicesProvider.future),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _BalanceCard(
              totalOutstanding: totalOutstanding,
              currency: currency,
              outstandingCount: outstanding.length,
            ),
            const SizedBox(height: 24),
            _SectionTitle(title: 'Outstanding (${outstanding.length})'),
            const SizedBox(height: 8),
            if (outstanding.isEmpty)
              _EmptySection(
                icon: Icons.check_circle_outline,
                message: 'No outstanding invoices',
                color: Colors.green,
              )
            else
              ...outstanding.map((invoice) => _InvoiceCard(invoice: invoice)),
            const SizedBox(height: 24),
            _PaidSection(invoices: paid),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Container(
              height: 160,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            const SizedBox(height: 24),
            ...List.generate(
              3,
              (_) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                height: 110,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.wifi_off_outlined,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load invoices',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => ref.invalidate(invoicesProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final int totalOutstanding;
  final String currency;
  final int outstandingCount;

  const _BalanceCard({
    required this.totalOutstanding,
    required this.currency,
    required this.outstandingCount,
  });

  @override
  Widget build(BuildContext context) {
    final formatted = NumberFormat('#,##0.00').format(totalOutstanding / 100);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).primaryColor.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withRed(200),
          ],
        ),
      ),
      child: Column(
        children: [
          const Text(
            'Total Outstanding Balance',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$currency $formatted',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (outstandingCount > 0) ...[
            const SizedBox(height: 4),
            Text(
              '$outstandingCount invoice${outstandingCount > 1 ? 's' : ''} pending',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium!.copyWith(
          fontWeight: FontWeight.w700,
          color: Colors.black87,
        ),
      ),
    );
  }
}

class _InvoiceCard extends StatelessWidget {
  final InvoiceModel invoice;
  const _InvoiceCard({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final formatted = NumberFormat(
      '#,##0.00',
    ).format(invoice.totalAmount / 100);
    final (statusColor, statusLabel) = _statusStyle(invoice.status);
    final days = invoice.daysUntilDue;
    final (bannerColor, bannerLabel) = _dueBannerStyle(days, invoice.status);

    return GestureDetector(
      onTap: () => context.push('/payments/${invoice.id}'),
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade100),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Due date banner (only for outstanding with a due date)
            if (bannerLabel != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: bannerColor!.withValues(alpha: 0.1),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                ),
                child: Text(
                  bannerLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: bannerColor,
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          invoice.code,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        _ContextBadge(invoice: invoice),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '${invoice.currency} $formatted',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
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
                    ],
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.chevron_right,
                    color: Colors.grey.shade400,
                    size: 20,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (Color, String) _statusStyle(String status) {
    return switch (status) {
      'PARTIALLY_PAID' => (Colors.orange.shade700, 'PARTIAL'),
      'PAID' => (Colors.green.shade700, 'PAID'),
      'VOID' => (Colors.grey.shade500, 'VOID'),
      _ => (Colors.red.shade700, 'UNPAID'),
    };
  }

  (Color?, String?) _dueBannerStyle(int? days, String status) {
    if (status == 'PAID' || status == 'VOID') return (null, null);
    if (days == null) return (null, null);
    if (days < 0) {
      return (
        Colors.red.shade700,
        'Overdue by ${-days} day${-days == 1 ? '' : 's'}',
      );
    }
    if (days == 0) return (Colors.red.shade700, 'Due today');
    if (days <= 3)
      return (Colors.red.shade600, 'Due in $days day${days == 1 ? '' : 's'}');
    if (days <= 7) return (Colors.orange.shade700, 'Due in $days days');
    return (null, null);
  }
}

class _ContextBadge extends StatelessWidget {
  final InvoiceModel invoice;
  const _ContextBadge({required this.invoice});

  @override
  Widget build(BuildContext context) {
    final (label, onTap) = _resolveContext(context, invoice);

    final badge = Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            badge,
            const SizedBox(width: 2),
            Icon(Icons.open_in_new, size: 11, color: Colors.grey.shade500),
          ],
        ),
      );
    }
    return badge;
  }

  (String, VoidCallback?) _resolveContext(
    BuildContext context,
    InvoiceModel invoice,
  ) {
    switch (invoice.contextType) {
      case 'LEASE_RENT':
        return ('Rent', () => context.push('/more/lease-details'));
      case 'TENANT_APPLICATION':
        final appId = invoice.contextTenantApplicationId;
        if (appId != null) {
          return (
            'Application',
            () => context.push('/more/tenant-application/$appId'),
          );
        }
        return ('Application', null);
      case 'MAINTENANCE':
        return ('Maintenance', null);
      case 'GENERAL_EXPENSE':
        return ('Expense', null);
      default:
        return (invoice.contextType, null);
    }
  }
}

class _PaidSection extends StatefulWidget {
  final List<InvoiceModel> invoices;
  const _PaidSection({required this.invoices});

  @override
  State<_PaidSection> createState() => _PaidSectionState();
}

class _PaidSectionState extends State<_PaidSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: widget.invoices.isNotEmpty
              ? () => setState(() => _expanded = !_expanded)
              : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text(
                  'Paid (${widget.invoices.length})',
                  style: Theme.of(context).textTheme.titleMedium!.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
                if (widget.invoices.isNotEmpty) ...[
                  const Spacer(),
                  Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_down,
                    color: Colors.grey.shade500,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        if (widget.invoices.isEmpty)
          _EmptySection(
            icon: Icons.receipt_long_outlined,
            message: 'No paid invoices yet',
            color: Colors.grey,
          )
        else if (_expanded)
          ...widget.invoices.map((invoice) => _InvoiceCard(invoice: invoice)),
      ],
    );
  }
}

class _EmptySection extends StatelessWidget {
  final IconData icon;
  final String message;
  final Color color;

  const _EmptySection({
    required this.icon,
    required this.message,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color.withValues(alpha: 0.5)),
          const SizedBox(width: 8),
          Text(
            message,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade500),
          ),
        ],
      ),
    );
  }
}
