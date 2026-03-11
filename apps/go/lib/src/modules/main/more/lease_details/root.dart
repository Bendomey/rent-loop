import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/launch_external_site.dart';
import 'package:rentloop_go/src/lib/money.dart';
import 'package:rentloop_go/src/lib/payment_frequency.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

class LeaseDetailsScreen extends ConsumerWidget {
  const LeaseDetailsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lease = ref.watch(currentLeaseNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lease Details'),
        leading: BackButton(onPressed: () => context.pop()),
      ),
      body: lease == null
          ? const Center(child: Text('No active lease found.'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _StatusHeader(lease: lease),
                const SizedBox(height: 16),
                _SectionCard(
                  title: 'Financials',
                  children: [
                    _DetailRow(
                      icon: Icons.payments_outlined,
                      label: 'Rent',
                      value: MoneyLib.formatPesewas(lease.rentFee),
                    ),
                    if (lease.paymentFrequency != null)
                      _DetailRow(
                        icon: Icons.repeat,
                        label: 'Payment Frequency',
                        value: getPaymentFrequencyLabel(
                          lease.paymentFrequency!,
                        ),
                      ),
                    if (lease.stayDuration != null)
                      _DetailRow(
                        icon: Icons.timelapse,
                        label: 'Duration',
                        value:
                            '${lease.stayDuration} ${lease.stayDurationFrequency != null ? getPaymentFrequencyPeriodLabel(lease.stayDurationFrequency!, count: lease.stayDuration!) : ''}',
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                _SectionCard(
                  title: 'Key Dates',
                  children: [
                    if (lease.moveInDate != null)
                      _DetailRow(
                        icon: Icons.door_front_door_outlined,
                        label: 'Move-in Date',
                        value: _formatDate(lease.moveInDate!),
                      ),
                    if (lease.activatedAt != null)
                      _DetailRow(
                        icon: Icons.check_circle_outline,
                        label: 'Activated',
                        value: _formatDate(lease.activatedAt!),
                      ),
                    if (lease.keyHandoverDate != null)
                      _DetailRow(
                        icon: Icons.key_outlined,
                        label: 'Key Handover',
                        value: _formatDate(lease.keyHandoverDate!),
                      ),
                    if (lease.propertyInspectionDate != null)
                      _DetailRow(
                        icon: Icons.search_outlined,
                        label: 'Property Inspection',
                        value: _formatDate(lease.propertyInspectionDate!),
                      ),
                    if (lease.createdAt != null)
                      _DetailRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Created',
                        value: _formatDate(lease.createdAt!),
                      ),
                    if (_calculateExpiry(lease) != null)
                      _DetailRow(
                        icon: Icons.event_busy_outlined,
                        label: 'Expires',
                        value: _calculateExpiry(lease)!,
                      ),
                  ],
                ),
                if (lease.leaseAgreementDocumentUrl != null &&
                    lease.leaseAgreementDocumentUrl!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _SectionCard(
                    title: 'Documents',
                    children: [
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.description_outlined),
                        title: const Text('Lease Agreement'),
                        trailing: const Icon(
                          Icons.open_in_new,
                          size: 18,
                          color: Colors.grey,
                        ),
                        onTap: () => launchExternalSite(
                          context,
                          lease.leaseAgreementDocumentUrl!,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                _SectionCard(
                  title: 'Reference',
                  children: [
                    _DetailRow(
                      icon: Icons.tag,
                      label: 'Lease Code',
                      value: lease.code,
                    ),
                    if (lease.unit != null) ...[
                      _DetailRow(
                        icon: Icons.apartment,
                        label: 'Unit',
                        value: lease.unit!.name,
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }

  String _formatDate(String iso) {
    try {
      return DateFormat('MMM d, yyyy').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  String? _calculateExpiry(LeaseModel lease) {
    if (lease.stayDuration == null || lease.stayDurationFrequency == null) {
      return null;
    }
    final baseIso = lease.moveInDate ?? lease.activatedAt ?? lease.createdAt;
    if (baseIso == null) return null;

    try {
      final base = DateTime.parse(baseIso).toLocal();
      final n = lease.stayDuration!;
      final freq = lease.stayDurationFrequency!.toUpperCase();

      final DateTime expiry;
      switch (freq) {
        case 'DAILY':
          expiry = base.add(Duration(days: n));
        case 'WEEKLY':
          expiry = base.add(Duration(days: n * 7));
        case 'MONTHLY':
          expiry = DateTime(base.year, base.month + n, base.day);
        case 'QUARTERLY':
          expiry = DateTime(base.year, base.month + n * 3, base.day);
        case 'BIANNUALLY':
          expiry = DateTime(base.year, base.month + n * 6, base.day);
        case 'ANNUALLY':
          expiry = DateTime(base.year + n, base.month, base.day);
        default:
          return null;
      }

      return DateFormat('MMM d, yyyy').format(expiry);
    } catch (_) {
      return null;
    }
  }
}

class _StatusHeader extends StatelessWidget {
  final LeaseModel lease;

  const _StatusHeader({required this.lease});

  @override
  Widget build(BuildContext context) {
    final label = leaseStatusLabel(lease.status);
    final (bgColor, textColor) = _statusColors(label);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lease.unit?.name ?? lease.unit?.slug ?? lease.code,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  lease.code,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: textColor.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: textColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color) _statusColors(String label) {
    switch (label.toLowerCase()) {
      case 'active':
        return (Colors.green.shade50, Colors.green.shade800);
      case 'pending':
        return (Colors.orange.shade50, Colors.orange.shade800);
      case 'cancelled':
      case 'terminated':
        return (Colors.red.shade50, Colors.red.shade800);
      case 'completed':
        return (Colors.blue.shade50, Colors.blue.shade800);
      default:
        return (Colors.grey.shade100, Colors.grey.shade800);
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;

  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: children.length,
            separatorBuilder: (_, __) =>
                Divider(height: 0, color: Colors.grey.shade100),
            itemBuilder: (_, i) => children[i],
          ),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade500),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade600),
            ),
          ),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
