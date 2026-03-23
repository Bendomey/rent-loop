import 'package:flutter/material.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

class LeaseOverviewCard extends ConsumerWidget {
  const LeaseOverviewCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lease = ref.watch(currentLeaseNotifierProvider);

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
              'Lease Overview',
              style: Theme.of(context).textTheme.titleLarge!.copyWith(
                fontSize: 17,
                fontFamily: "Shantell",
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    label: 'Rent',
                    value: lease != null
                        ? MoneyLib.formatPesewas(lease.rentFee)
                        : '--',
                  ),
                ),
                Expanded(
                  child: _Field(
                    label: 'Frequency',
                    value: lease?.paymentFrequency ?? '--',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    label: 'Status',
                    value: lease != null
                        ? leaseStatusLabel(lease.status)
                        : '--',
                  ),
                ),
                Expanded(
                  child: _Field(
                    label: 'Move-in Date',
                    value: _formatDate(lease?.moveInDate),
                  ),
                ),
              ],
            ),
            if (lease?.stayDuration != null) ...[
              const SizedBox(height: 14),
              _Field(
                label: 'Duration',
                value:
                    '${lease!.stayDuration} ${lease.stayDurationFrequency ?? ''}',
              ),
            ],
            // const SizedBox(height: 16),
            // SizedBox(
            //   width: double.infinity,
            //   child: OutlinedButton(
            //     onPressed: () async {
            //       await Haptics.vibrate(HapticsType.selection);
            //       if (context.mounted) context.push('/more/lease-details');
            //     },
            //     child: const Text('View Lease Details'),
            //   ),
            // ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '--';
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(dateStr));
    } catch (_) {
      return '--';
    }
  }
}

class _Field extends StatelessWidget {
  final String label;
  final String value;

  const _Field({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey.shade500,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
