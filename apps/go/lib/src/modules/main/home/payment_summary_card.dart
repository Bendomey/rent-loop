import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/repository/providers/invoices_provider.dart';

class PaymentSummaryCard extends ConsumerWidget {
  const PaymentSummaryCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(invoiceStatsProvider);

    if (!statsAsync.hasValue && statsAsync.isLoading) {
      return _PaymentSummarySkeleton();
    }

    final stats = statsAsync.valueOrNull ?? {};
    final outstandingBalance = (stats['outstanding_amount'] as num? ?? 0)
        .toInt();
    final totalPaid = (stats['paid_amount'] as num? ?? 0).toInt();
    final pendingCount =
        ((stats['issued_count'] as num? ?? 0) +
                (stats['partially_paid_count'] as num? ?? 0))
            .toInt();

    return Card(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade100, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Summary',
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                fontSize: 17,
                fontFamily: "Shantell",
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'A snapshot of your payment activity.',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 15),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    label: 'Outstanding',
                    value: MoneyLib.formatPesewas(outstandingBalance),
                    color: outstandingBalance > 0
                        ? Colors.red.shade700
                        : Colors.grey.shade500,
                    icon: Icons.pending_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _StatTile(
                    label: 'Total Paid',
                    value: MoneyLib.formatPesewas(totalPaid),
                    color: Colors.green.shade700,
                    icon: Icons.check_circle_outline,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _StatTile(
                    label: 'Pending',
                    value:
                        '$pendingCount invoice${pendingCount == 1 ? '' : 's'}',
                    color: pendingCount > 0
                        ? Colors.orange.shade700
                        : Colors.grey.shade500,
                    icon: Icons.receipt_outlined,
                  ),
                ),
              ],
            ),
            // const SizedBox(height: 12),
            // SizedBox(
            //   width: double.infinity,
            //   child: FilledButton(
            //     onPressed: () async {
            //       await Haptics.vibrate(HapticsType.selection);
            //       if (context.mounted) context.push('/payments');
            //     },
            //     child: const Text('View All Payments'),
            //   ),
            // ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 13,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }
}

class _PaymentSummarySkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
