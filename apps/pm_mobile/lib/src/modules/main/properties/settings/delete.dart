import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/repository/models/property_deletion_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/delete_property_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/properties/properties_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/onboarding_checklist_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_deletion_preview_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Property settings → Danger zone → Delete property. One screen, internal
/// stage state — mirrors the Figma `MobileDelete` flow-shell: fetches the
/// deletion preview, then branches on `can_delete` into Blocked or Confirm,
/// ending on a local Done stage after a successful delete.
class PropertyDeleteScreen extends ConsumerStatefulWidget {
  const PropertyDeleteScreen({super.key, required this.propertyId});
  final String propertyId;

  @override
  ConsumerState<PropertyDeleteScreen> createState() =>
      _PropertyDeleteScreenState();
}

class _PropertyDeleteScreenState extends ConsumerState<PropertyDeleteScreen> {
  final _typedController = TextEditingController();
  bool _done = false;
  String? _deletedPropertyName;

  @override
  void dispose() {
    _typedController.dispose();
    super.dispose();
  }

  Future<void> _submitDelete(String propertyName) async {
    await Haptics.vibrate(HapticsType.warning);
    await ref
        .read(deletePropertyNotifierProvider.notifier)
        .submit(propertyId: widget.propertyId);

    if (!mounted) return;
    final result = ref.read(deletePropertyNotifierProvider);
    if (result.status.isSuccess()) {
      await Haptics.vibrate(HapticsType.success);
      ref.invalidate(propertyDetailProvider(widget.propertyId));
      ref
          .read(propertiesNotifierProvider.notifier)
          .loadFirstPage(const PropertiesQuery());
      ref.invalidate(onboardingChecklistProvider);
      setState(() {
        _deletedPropertyName = propertyName;
        _done = true;
      });
    } else {
      await Haptics.vibrate(HapticsType.error);
      if (result.blockedByOccupancy) {
        // The eligibility check we ran a moment ago is now stale — someone
        // else added a lease/booking/application in between. Refetch the
        // preview so the screen falls through to the Blocked branch below,
        // matching the web portal's own re-check behavior.
        ref.invalidate(propertyDeletionPreviewProvider(widget.propertyId));
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.errorMessage ?? 'Something happened. Try again.',
            ),
            backgroundColor: RLTokens.danger,
          ),
        );
      }
      ref.read(deletePropertyNotifierProvider.notifier).reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_done) {
      return _DoneStage(propertyName: _deletedPropertyName ?? 'Property');
    }

    final propertyAsync = ref.watch(propertyDetailProvider(widget.propertyId));
    final previewAsync = ref.watch(
      propertyDeletionPreviewProvider(widget.propertyId),
    );

    final loading =
        (!propertyAsync.hasValue && propertyAsync.isLoading) ||
        (!previewAsync.hasValue && previewAsync.isLoading);
    if (loading) {
      return const Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            RLBackHeader(title: 'Delete property'),
            Expanded(child: _DeleteScreenSkeleton()),
          ],
        ),
      );
    }

    if (propertyAsync.hasError || previewAsync.hasError) {
      return Scaffold(
        backgroundColor: RLTokens.surface,
        body: Column(
          children: [
            const RLBackHeader(title: 'Delete property'),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(RLTokens.gutter),
                child: RLSectionError(
                  onRetry: () {
                    ref.invalidate(propertyDetailProvider(widget.propertyId));
                    ref.invalidate(
                      propertyDeletionPreviewProvider(widget.propertyId),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      );
    }

    final property = propertyAsync.value!;
    final preview = previewAsync.value!;
    final deleteState = ref.watch(deletePropertyNotifierProvider);

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: preview.canDelete
          ? _ConfirmStage(
              property: property,
              preview: preview,
              typedController: _typedController,
              submitting: deleteState.status.isLoading(),
              onSubmit: () => _submitDelete(property.name),
            )
          : _BlockedStage(property: property, preview: preview),
    );
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

class _DeleteScreenSkeleton extends StatelessWidget {
  const _DeleteScreenSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          RLTokens.gutter,
          16,
          RLTokens.gutter,
          24,
        ),
        children: [
          Container(
            height: 66,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            height: 90,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Shared property header strip ────────────────────────────────────────────

class _DelPropCard extends StatelessWidget {
  const _DelPropCard({required this.property});
  final PropertyModel property;

  @override
  Widget build(BuildContext context) {
    final location = [
      property.address,
      property.city,
    ].whereType<String>().where((v) => v.isNotEmpty).join(', ');
    // Same rule as the settings hub identity card: blocks/units must always
    // stay fully visible — only the (potentially long) location clips with
    // an ellipsis, in its own Flexible.
    final stats =
        '${property.blocksCount} ${property.blocksCount == 1 ? 'block' : 'blocks'} · '
        '${property.unitsCount} ${property.unitsCount == 1 ? 'unit' : 'units'}';
    final images = property.images ?? const [];

    return RLCard(
      padding: const EdgeInsets.all(13),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(11),
            child: SizedBox(
              width: 44,
              height: 44,
              child: images.isNotEmpty
                  ? Image.network(
                      images.first,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const _DelPropIconTile(),
                      loadingBuilder: (_, child, progress) =>
                          progress == null ? child : const _DelPropIconTile(),
                    )
                  : const _DelPropIconTile(),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  property.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSerif,
                    fontSize: 17,
                    color: RLTokens.ink,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    if (location.isNotEmpty) ...[
                      Flexible(
                        child: Text(
                          location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12.5,
                            color: RLTokens.muted,
                          ),
                        ),
                      ),
                      const Text(
                        ' · ',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.muted,
                        ),
                      ),
                    ],
                    Text(
                      stats,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        color: RLTokens.muted,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DelPropIconTile extends StatelessWidget {
  const _DelPropIconTile();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.fill,
      child: const Icon(
        Icons.apartment_outlined,
        size: 20,
        color: RLTokens.mutedSoft,
      ),
    );
  }
}

// ── Impact row (blocking reason or "will be archived" line) ────────────────

class _ImpactRow extends StatelessWidget {
  const _ImpactRow({
    required this.icon,
    required this.iconTone,
    required this.label,
    required this.count,
    this.note,
    this.actionLabel,
    this.onAction,
    this.dim = false,
    this.last = false,
  });

  final IconData icon;
  final RLTone iconTone;
  final String label;
  final int count;
  final String? note;
  final String? actionLabel;
  final VoidCallback? onAction;
  final bool dim;
  final bool last;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: dim ? 0.6 : 1,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 2),
        decoration: BoxDecoration(
          border: last
              ? null
              : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
        ),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: iconTone.bg,
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, size: 16, color: iconTone.fg),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                      const SizedBox(width: 7),
                      Text(
                        '$count',
                        style: TextStyle(
                          fontFamily: RLTokens.fontMono,
                          fontSize: 12,
                          fontWeight: RLTokens.bold,
                          color: iconTone.fg,
                        ),
                      ),
                    ],
                  ),
                  if (note != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      note!,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.muted,
                        height: 1.35,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (actionLabel != null)
              GestureDetector(
                onTap: onAction,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      actionLabel!,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12.5,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.crimson,
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: RLTokens.crimson,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

IconData _blockingReasonIcon(String type) => switch (type) {
  'LEASE' => Icons.description_outlined,
  'BOOKING' => Icons.calendar_today_outlined,
  'TENANT_APPLICATION' => Icons.person_outline_rounded,
  _ => Icons.info_outline_rounded,
};

String? _blockingReasonNote(String type) => switch (type) {
  'LEASE' => 'End or transfer each lease first',
  'BOOKING' => 'Check out or cancel current guests',
  'TENANT_APPLICATION' => 'Approve, reject or withdraw them',
  _ => null,
};

// ── Blocked stage ─────────────────────────────────────────────────────────

class _BlockedStage extends StatelessWidget {
  const _BlockedStage({required this.property, required this.preview});
  final PropertyModel property;
  final PropertyDeletionPreviewModel preview;

  @override
  Widget build(BuildContext context) {
    final blockers = preview.blockingReasons;
    final willLose = _summaryRows(preview.willBeDeleted);
    final blockedCount = blockers.fold<int>(0, (s, b) => s + b.count);

    return Column(
      children: [
        const RLBackHeader(title: 'Delete property'),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              RLTokens.gutter,
              10,
              RLTokens.gutter,
              160,
            ),
            children: [
              _DelPropCard(property: property),
              const SizedBox(height: 14),
              const RLInlineBanner(
                tone: RLBannerTone.danger,
                icon: Icons.warning_amber_rounded,
                title: 'This property can\'t be deleted yet',
                body:
                    'It still has active occupancy. End or resolve everything '
                    'below, then you\'ll be able to delete it.',
              ),
              RLLabel('Blocking deletion', action: '$blockedCount items'),
              RLCard(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                child: Column(
                  children: [
                    for (var i = 0; i < blockers.length; i++)
                      _ImpactRow(
                        icon: _blockingReasonIcon(blockers[i].type),
                        iconTone: RLTone.danger,
                        label: blockers[i].label,
                        count: blockers[i].count,
                        note: _blockingReasonNote(blockers[i].type),
                        last: i == blockers.length - 1,
                        actionLabel: blockers[i].type == 'LEASE'
                            ? 'Resolve'
                            : null,
                        onAction: blockers[i].type == 'LEASE'
                            ? () => context.push(
                                '/more/leases?property_id=${property.id}&property_name=${Uri.encodeComponent(property.name)}',
                              )
                            : null,
                      ),
                  ],
                ),
              ),
              if (willLose.isNotEmpty) ...[
                const RLLabel('Would be deleted once cleared'),
                RLCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  child: Column(
                    children: [
                      for (var i = 0; i < willLose.length; i++)
                        _ImpactRow(
                          icon: willLose[i].$1,
                          iconTone: RLTone.neutral,
                          label: willLose[i].$2,
                          count: willLose[i].$3,
                          dim: true,
                          last: i == willLose.length - 1,
                        ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ── Confirm stage ────────────────────────────────────────────────────────

class _ConfirmStage extends StatefulWidget {
  const _ConfirmStage({
    required this.property,
    required this.preview,
    required this.typedController,
    required this.submitting,
    required this.onSubmit,
  });

  final PropertyModel property;
  final PropertyDeletionPreviewModel preview;
  final TextEditingController typedController;
  final bool submitting;
  final VoidCallback onSubmit;

  @override
  State<_ConfirmStage> createState() => _ConfirmStageState();
}

class _ConfirmStageState extends State<_ConfirmStage> {
  @override
  void initState() {
    super.initState();
    widget.typedController.addListener(_onChanged);
  }

  @override
  void dispose() {
    widget.typedController.removeListener(_onChanged);
    super.dispose();
  }

  void _onChanged() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final willLose = _summaryRows(widget.preview.willBeDeleted);
    final isEmpty = willLose.isEmpty;
    final match = widget.typedController.text.trim() == widget.property.name;

    return Column(
      children: [
        const RLBackHeader(title: 'Delete property'),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(
              RLTokens.gutter,
              10,
              RLTokens.gutter,
              200,
            ),
            children: [
              _DelPropCard(property: widget.property),
              const SizedBox(height: 14),
              const RLInlineBanner(
                tone: RLBannerTone.info,
                icon: Icons.info_outline_rounded,
                title: 'You can undo this',
                body:
                    'The property is archived, not permanently erased. '
                    'Restore it anytime from Settings › Archived properties.',
              ),
              if (isEmpty) ...[
                const SizedBox(height: 4),
                RLCard(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: RLTokens.successBg,
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 17,
                          color: RLTokens.success,
                        ),
                      ),
                      const SizedBox(width: 11),
                      const Expanded(
                        child: Text(
                          'Nothing else is connected to this property. '
                          'Deleting it removes only the property record itself.',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 13.5,
                            color: RLTokens.inkSoft,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                RLLabel(
                  'What will be archived',
                  action:
                      '${widget.preview.willBeDeleted.blocks + widget.preview.willBeDeleted.units + widget.preview.willBeDeleted.leases + widget.preview.willBeDeleted.bookings + widget.preview.willBeDeleted.tenantApplications} records',
                ),
                RLCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  child: Column(
                    children: [
                      for (var i = 0; i < willLose.length; i++)
                        _ImpactRow(
                          icon: willLose[i].$1,
                          iconTone: i < 2 ? RLTone.danger : RLTone.neutral,
                          label: willLose[i].$2,
                          count: willLose[i].$3,
                          last: i == willLose.length - 1,
                        ),
                    ],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(2, 10, 2, 0),
                  child: Text(
                    'These move to the archive with the property. Blocks and '
                    'units become inactive; leases, bookings and applications '
                    'are kept read-only for your records.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
              const RLLabel('Confirm'),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.inkSoft,
                      height: 1.5,
                    ),
                    children: [
                      const TextSpan(text: 'Type '),
                      TextSpan(
                        text: widget.property.name,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontWeight: RLTokens.bold,
                          color: RLTokens.crimson,
                        ),
                      ),
                      const TextSpan(text: ' to confirm.'),
                    ],
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rMd),
                  border: Border.all(color: RLTokens.hairline, width: 1.5),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: TextField(
                  controller: widget.typedController,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14.5,
                    color: RLTokens.ink,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.property.name,
                    hintStyle: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      color: RLTokens.mutedSoft,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: EdgeInsets.fromLTRB(
            RLTokens.gutter,
            12,
            RLTokens.gutter,
            12 + MediaQuery.of(context).padding.bottom,
          ),
          decoration: const BoxDecoration(
            color: RLTokens.surface,
            border: Border(top: BorderSide(color: RLTokens.hairline)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RLBtn(
                label: widget.submitting ? 'Deleting…' : 'Delete property',
                icon: Icons.delete_outline_rounded,
                kind: RLBtnKind.primary,
                full: true,
                onPressed: (match && !widget.submitting)
                    ? widget.onSubmit
                    : null,
              ),
              const SizedBox(height: 4),
              TextButton(
                onPressed: widget.submitting
                    ? null
                    : () => Navigator.of(context).pop(),
                child: const Text(
                  'Cancel',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13.5,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.muted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Done stage ────────────────────────────────────────────────────────────

class _DoneStage extends StatelessWidget {
  const _DoneStage({required this.propertyName});
  final String propertyName;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Delete property',
            onBack: () => context.go('/properties'),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(30, 20, 30, 90),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 74,
                    height: 74,
                    decoration: const BoxDecoration(
                      color: RLTokens.successBg,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      size: 38,
                      color: RLTokens.success,
                    ),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Property deleted',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 25,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: propertyName,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontWeight: RLTokens.bold,
                            color: RLTokens.ink,
                          ),
                        ),
                        const TextSpan(
                          text:
                              ' and its records were archived. Nothing was '
                              'permanently erased.',
                        ),
                      ],
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14,
                        color: RLTokens.muted,
                        height: 1.55,
                      ),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 26),
                  RLBtn(
                    label: 'View archived properties',
                    kind: RLBtnKind.light,
                    icon: Icons.inventory_2_outlined,
                    full: true,
                    onPressed: () {
                      context.go('/properties');
                      context.push('/more/archived-properties');
                    },
                  ),
                  const SizedBox(height: 10),
                  RLBtn(
                    label: 'Back to portfolio',
                    kind: RLBtnKind.primary,
                    full: true,
                    onPressed: () => context.go('/properties'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Summary row helper ──────────────────────────────────────────────────────

/// (icon, label, count) tuples for a [PropertyDeletionSummaryModel], zero
/// counts omitted — mirrors `MDelConfirm`'s `willLose.map(...)` filtering.
List<(IconData, String, int)> _summaryRows(PropertyDeletionSummaryModel s) {
  final rows = <(IconData, String, int)>[];
  if (s.blocks > 0) {
    rows.add((Icons.grid_view_rounded, 'Blocks', s.blocks));
  }
  if (s.units > 0) {
    rows.add((Icons.apartment_outlined, 'Units', s.units));
  }
  if (s.leases > 0) {
    rows.add((Icons.description_outlined, 'Leases', s.leases));
  }
  if (s.bookings > 0) {
    rows.add((Icons.calendar_today_outlined, 'Bookings', s.bookings));
  }
  if (s.tenantApplications > 0) {
    rows.add((
      Icons.person_outline_rounded,
      'Applications',
      s.tenantApplications,
    ));
  }
  return rows;
}
