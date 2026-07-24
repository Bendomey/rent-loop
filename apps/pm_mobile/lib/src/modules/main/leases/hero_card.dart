import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:intl/intl.dart';

import 'package:rentloop_manager/src/lib/lease_status.dart';
import 'package:rentloop_manager/src/lib/money.dart';
import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/modules/main/leases/start_lease_sheet.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

String _formatDate(String? iso) {
  if (iso == null) return '—';
  final date = DateTime.tryParse(iso);
  if (date == null) return '—';
  return DateFormat('d MMMM y').format(date.toLocal());
}

/// Hero card at the top of the lease detail screen: unit photo, status
/// pill, tappable tenant/unit rows, rent, a term-progress bar (Active
/// leases only), Created/Updated dates, the application link, and (Pending
/// leases only) an inline "Start Lease" button.
class LeaseHeroCard extends ConsumerWidget {
  const LeaseHeroCard({
    super.key,
    required this.propertyId,
    required this.lease,
  });
  final String propertyId;
  final LeaseModel lease;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusLabel = propertyStatusLabel(lease.status);
    final tenant = lease.tenant;
    final unit = lease.unit;
    final isActive = lease.status == 'Lease.Status.Active';
    final isPending = lease.status == 'Lease.Status.Pending';
    final moveInDate = lease.moveInDate != null
        ? DateTime.tryParse(lease.moveInDate!)
        : null;
    final hasMoveInStarted =
        moveInDate != null && !moveInDate.isAfter(DateTime.now());

    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 150,
            width: double.infinity,
            child: Stack(
              children: [
                Positioned.fill(child: _LeaseHeroPhoto(unit: unit)),
                Positioned(
                  top: 12,
                  right: 12,
                  child: RLPill(
                    statusLabel,
                    tone: statusTone(statusLabel),
                    large: true,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.description_outlined,
                      size: 18,
                      color: RLTokens.ink,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        lease.code,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 15,
                          fontWeight: RLTokens.bold,
                          color: RLTokens.ink,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                RLRow(
                  leading: RLAvatar(
                    tenant?.fullName ?? '?',
                    crimsonTone: true,
                    size: 36,
                  ),
                  title: tenant?.fullName ?? '—',
                  subtitle: 'Tenant',
                  onTap: tenant != null
                      ? () async {
                          await Haptics.vibrate(HapticsType.selection);
                          if (context.mounted) {
                            context.push('/more/tenants/${tenant.id}');
                          }
                        }
                      : null,
                ),
                RLRow(
                  leading: const RLIconTile(
                    icon: Icons.home_outlined,
                    tone: RLTone.neutral,
                  ),
                  title: unit?.name ?? '—',
                  subtitle: unit != null ? unitTypeLabel(unit.type) : null,
                  last: true,
                  onTap: unit?.propertyId != null
                      ? () async {
                          await Haptics.vibrate(HapticsType.selection);
                          if (context.mounted) {
                            context.push(
                              '/properties/${unit!.propertyId}/units/${unit.id}',
                            );
                          }
                        }
                      : null,
                ),
                const SizedBox(height: 4),
                const Divider(height: 1, color: RLTokens.hairlineSoft),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Rent Fee',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 11.5,
                            color: RLTokens.muted,
                          ),
                        ),
                        const SizedBox(height: 4),
                        RLMoney(pesewasToCedis(lease.rentFee), size: 28),
                      ],
                    ),
                    Text(
                      paymentFrequencyLabel(lease.paymentFrequency ?? '—'),
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
                if ((isActive || isPending) && hasMoveInStarted) ...[
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: RLTokens.hairlineSoft),
                  const SizedBox(height: 14),
                  _TermProgress(lease: lease),
                ],
                const SizedBox(height: 14),
                const Divider(height: 1, color: RLTokens.hairlineSoft),
                const SizedBox(height: 14),
                _DateRow(label: 'Created On', iso: lease.createdAt),
                const SizedBox(height: 10),
                _DateRow(label: 'Updated On', iso: lease.updatedAt),
                if (lease.tenantApplicationId != null) ...[
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: RLTokens.hairlineSoft),
                  const SizedBox(height: 14),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) {
                        context.push(
                          '/activity/applications/${lease.tenantApplicationId}',
                        );
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.open_in_new_rounded,
                          size: 13,
                          color: RLTokens.info,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          'View Application'
                          '${lease.tenantApplication != null ? ' (${lease.tenantApplication!.code})' : ''}',
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.info,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                if (isPending) ...[
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: RLTokens.hairlineSoft),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerRight,
                    child: RLBtn(
                      label: 'Start Lease',
                      icon: Icons.check_rounded,
                      onPressed: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (!context.mounted) return;
                        final result = await showStartLeaseSheet(
                          context: context,
                          propertyId: propertyId,
                          lease: lease,
                        );
                        if (result != null) {
                          ref.invalidate(
                            leaseDetailProvider(propertyId, lease.id),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Unit photo header — the unit's first photo when it has one, else a
/// tinted placeholder keyed by unit type. Duplicates `_SingleUnitThumb`'s
/// color/icon recipe from `properties/detail.dart` (private to that file,
/// so not importable) rather than sharing it — same small-duplication
/// convention already used for `_formatDate` across this feature's files.
class _LeaseHeroPhoto extends StatelessWidget {
  const _LeaseHeroPhoto({required this.unit});
  final UnitModel? unit;

  static Color _color(String type) => switch (type) {
    'APARTMENT' => const Color(0xFF2A4099),
    'HOUSE' => const Color(0xFF8A5F20),
    'STUDIO' => const Color(0xFF3A6B5E),
    'OFFICE' => const Color(0xFF4A4A4A),
    'RETAIL' => const Color(0xFF6B3F8A),
    _ => const Color(0xFF8A5F20),
  };

  static IconData _icon(String type) => switch (type) {
    'APARTMENT' => Icons.apartment_rounded,
    'HOUSE' => Icons.house_rounded,
    'STUDIO' => Icons.grid_view_rounded,
    'OFFICE' => Icons.business_center_rounded,
    'RETAIL' => Icons.storefront_rounded,
    _ => Icons.apartment_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final images = unit?.images;
    final type = unit?.type ?? 'APARTMENT';
    if (images != null && images.isNotEmpty) {
      return Image.network(
        images.first,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        errorBuilder: (_, _, _) => _placeholder(type),
        loadingBuilder: (_, child, progress) =>
            progress == null ? child : _placeholder(type),
      );
    }
    return _placeholder(type);
  }

  Widget _placeholder(String type) {
    return Container(
      color: _color(type),
      child: Center(
        child: Icon(_icon(type), size: 40, color: Colors.white.withAlpha(40)),
      ),
    );
  }
}

class _TermProgress extends StatelessWidget {
  const _TermProgress({required this.lease});
  final LeaseModel lease;

  @override
  Widget build(BuildContext context) {
    final progress = leaseTermProgress(lease);
    final endingSoon = progress.daysLeft <= 14;
    final barColor = endingSoon ? RLTokens.warning : RLTokens.crimson;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'MOVE-IN',
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 9.5,
                    letterSpacing: 0.6,
                    color: RLTokens.mutedSoft,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  _formatDate(lease.moveInDate),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'MOVE-OUT',
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 9.5,
                    letterSpacing: 0.6,
                    color: RLTokens.mutedSoft,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  _formatDate(lease.moveOutDate),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 9),
        RLBar(percent: progress.percent, color: barColor),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Month ${progress.monthOf} of ${progress.monthsTotal}',
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11.5,
                color: RLTokens.muted,
              ),
            ),
            Text(
              progress.daysLeft >= 0
                  ? '${progress.daysLeft} days left'
                  : 'Ended ${-progress.daysLeft} days ago',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11.5,
                fontWeight: RLTokens.bold,
                color: endingSoon ? RLTokens.warning : RLTokens.muted,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _DateRow extends StatelessWidget {
  const _DateRow({required this.label, required this.iso});
  final String label;
  final String? iso;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(
          Icons.calendar_today_outlined,
          size: 15,
          color: RLTokens.muted,
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 11,
                color: RLTokens.muted,
              ),
            ),
            Text(
              _formatDate(iso),
              style: const TextStyle(
                fontFamily: RLTokens.fontSans,
                fontSize: 13,
                color: RLTokens.ink,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
