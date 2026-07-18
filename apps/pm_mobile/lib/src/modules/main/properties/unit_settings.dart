import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/lib/property_status.dart';
import 'package:rentloop_manager/src/lib/unit_status.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/delete_unit_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/units/units_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_blocks_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_units_preview_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/unit_detail_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kOccupiedStatuses = {
  'Unit.Status.Occupied',
  'Unit.Status.PartiallyOccupied',
};

class UnitSettingsHubScreen extends ConsumerWidget {
  const UnitSettingsHubScreen({
    super.key,
    required this.propertyId,
    required this.unitId,
  });
  final String propertyId;
  final String unitId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unitAsync = ref.watch(unitDetailProvider(propertyId, unitId));
    final isMulti =
        ref.watch(propertyDetailProvider(propertyId)).valueOrNull?.type ==
        'MULTI';
    final unit = unitAsync.valueOrNull;
    final isOccupied = unit != null && _kOccupiedStatuses.contains(unit.status);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'Unit settings'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                10,
                RLTokens.gutter,
                24,
              ),
              children: [
                // Unit identity card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 46,
                          height: 46,
                          color: RLTokens.fill,
                          child: const Icon(
                            Icons.grid_view_rounded,
                            size: 22,
                            color: RLTokens.mutedSoft,
                          ),
                        ),
                      ),
                      const SizedBox(width: 13),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              unit?.name ?? 'Unit',
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 18,
                                color: RLTokens.ink,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              unit != null
                                  ? '${unitTypeLabel(unit.type)} · ${propertyStatusLabel(unit.status)}'
                                  : '—',
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                _sectionLabel('Unit settings'),
                _TileRow(
                  iconBg: RLTokens.crimsonTint,
                  iconColor: RLTokens.crimson,
                  icon: Icons.edit_outlined,
                  title: 'Edit',
                  sub: 'Type, details, rent and occupancy',
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (context.mounted) {
                      context.push(
                        '/properties/$propertyId/units/$unitId/edit',
                      );
                    }
                  },
                ),

                if (isMulti) ...[
                  _sectionLabel('Danger zone'),
                  _TileRow(
                    iconBg: isOccupied ? RLTokens.neutralBg : RLTokens.dangerBg,
                    iconColor: isOccupied ? RLTokens.micro : RLTokens.danger,
                    icon: Icons.delete_outline_rounded,
                    title: 'Delete unit',
                    sub: isOccupied
                        ? 'Occupied units can\'t be deleted — vacate it first.'
                        : 'This can\'t be undone.',
                    onTap: isOccupied
                        ? null
                        : () => _confirmDelete(context, ref),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 20, 0, 10),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: RLTokens.fontSans,
          fontSize: 12.5,
          fontWeight: RLTokens.semibold,
          color: RLTokens.muted,
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    await Haptics.vibrate(HapticsType.warning);
    if (!context.mounted) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Delete unit?',
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: 21,
            color: RLTokens.ink,
          ),
        ),
        content: const Text(
          'This unit will be permanently deleted. This can\'t be undone.',
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            color: RLTokens.muted,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'Cancel',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.ink,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text(
              'Delete',
              style: TextStyle(
                fontFamily: RLTokens.fontSans,
                fontWeight: RLTokens.semibold,
                color: RLTokens.danger,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    if (!context.mounted) return;

    await ref
        .read(deleteUnitNotifierProvider.notifier)
        .submit(propertyId: propertyId, unitId: unitId);

    if (!context.mounted) return;
    final state = ref.read(deleteUnitNotifierProvider);
    if (state.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(propertyUnitsPreviewProvider(propertyId));
      ref.invalidate(propertyStatsProvider(propertyId));
      ref.invalidate(propertyBlocksProvider(propertyId));
      await ref.read(unitsNotifierProvider.notifier).loadFirstPage(propertyId);
      if (context.mounted) {
        showRLToast(ref, tone: RLToastTone.success, title: 'Unit deleted');
        context.go('/properties/$propertyId/units');
      }
    } else {
      await Haptics.vibrate(HapticsType.error);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              state.errorMessage ?? 'Something happened. Try again.',
            ),
            backgroundColor: RLTokens.danger,
          ),
        );
      }
    }
  }
}

// ── Tile row ──────────────────────────────────────────────────────────────────

class _TileRow extends StatelessWidget {
  const _TileRow({
    required this.iconBg,
    required this.iconColor,
    required this.icon,
    required this.title,
    required this.sub,
    required this.onTap,
  });
  final Color iconBg, iconColor;
  final IconData icon;
  final String title, sub;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: disabled ? 0.55 : 1,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: RLTokens.surface,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.hairline),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 18, color: iconColor),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      sub,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ),
              if (!disabled)
                const Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: RLTokens.micro,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
