import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';

import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Rows past this point collapse behind "Show more" so a request covering a
/// dozen assets doesn't bury the rest of the screen.
const _kCollapseAfter = 5;

/// Compact scope chip for the hero card, so the reach of a request reads
/// without scrolling to the section below.
class MaintenanceAssetSummary extends StatelessWidget {
  const MaintenanceAssetSummary({super.key, required this.request});

  final MaintenanceRequestModel request;

  @override
  Widget build(BuildContext context) {
    final blocks = request.blockAssets.length;
    final units = request.unitAssets.length;

    final label = blocks + units == 0
        ? 'Whole property'
        : [
            if (blocks > 0) '$blocks ${blocks == 1 ? 'block' : 'blocks'}',
            if (units > 0) '$units ${units == 1 ? 'unit' : 'units'}',
          ].join(' · ');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rSm),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.apartment_outlined, size: 15, color: RLTokens.muted),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              fontWeight: RLTokens.bold,
              color: RLTokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}

/// Every selected asset stands on its own. Blocks and units are listed as
/// peers under type headings — a unit is deliberately NOT drawn inside a
/// block, because selecting a block does not select its units.
class MaintenanceSelectedAssets extends StatefulWidget {
  const MaintenanceSelectedAssets({super.key, required this.request});

  final MaintenanceRequestModel request;

  @override
  State<MaintenanceSelectedAssets> createState() =>
      _MaintenanceSelectedAssetsState();
}

class _MaintenanceSelectedAssetsState extends State<MaintenanceSelectedAssets> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final request = widget.request;
    final blocks = request.blockAssets;
    final units = request.unitAssets;
    final total = blocks.length + units.length;

    if (total == 0) return const _WholeProperty();

    // The cap spans both sections, so five blocks don't crowd out every unit.
    var budget = _kCollapseAfter;

    final sections = <Widget>[];
    for (final section in [
      (label: 'Blocks', assets: blocks),
      (label: 'Units', assets: units),
    ]) {
      if (section.assets.isEmpty) continue;
      final shown = _expanded
          ? section.assets
          : section.assets.take(budget < 0 ? 0 : budget).toList();
      budget -= shown.length;
      if (shown.isEmpty) continue;

      sections.add(
        _AssetSection(
          label: section.label,
          count: section.assets.length,
          assets: shown,
          propertyId: request.propertyId,
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(2, RLTokens.space6, 2, 0),
          child: Row(
            children: [
              const Expanded(
                child: Text(
                  'SELECTED ASSETS',
                  style: TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: RLTokens.textLabel,
                    fontWeight: RLTokens.medium,
                    letterSpacing: 1.1,
                    color: RLTokens.mutedSoft,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rPill),
                ),
                child: Text(
                  '$total',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 11,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                  ),
                ),
              ),
            ],
          ),
        ),
        const Padding(
          padding: EdgeInsets.fromLTRB(2, 6, 2, 12),
          child: Text(
            'Each was selected on its own — a block does not include its units.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 12.5,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
        ),
        for (final section in sections) section,
        if (total > _kCollapseAfter)
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (mounted) setState(() => _expanded = !_expanded);
            },
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _expanded
                        ? 'Show less'
                        : 'Show ${total - _kCollapseAfter} more',
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.bold,
                      color: RLTokens.crimson,
                    ),
                  ),
                  const SizedBox(width: 7),
                  Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: RLTokens.crimson,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _AssetSection extends StatelessWidget {
  const _AssetSection({
    required this.label,
    required this.count,
    required this.assets,
    required this.propertyId,
  });

  final String label;
  final int count;
  final List<MaintenanceAssetModel> assets;
  final String? propertyId;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(2, 0, 2, 7),
            child: Row(
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 9.5,
                    fontWeight: RLTokens.bold,
                    letterSpacing: 0.7,
                    color: RLTokens.mutedSoft,
                  ),
                ),
                const SizedBox(width: 7),
                Text(
                  '$count',
                  style: const TextStyle(
                    fontFamily: RLTokens.fontMono,
                    fontSize: 10.5,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.muted,
                  ),
                ),
              ],
            ),
          ),
          RLCard(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                for (final asset in assets)
                  _AssetRow(
                    asset: asset,
                    propertyId: propertyId,
                    last: asset == assets.last,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AssetRow extends StatelessWidget {
  const _AssetRow({
    required this.asset,
    required this.propertyId,
    required this.last,
  });

  final MaintenanceAssetModel asset;
  final String? propertyId;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final isBlock = asset.isBlock;
    final blockName = asset.unit?.propertyBlock?.name;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        if (!context.mounted || propertyId == null) return;
        // There is no block detail screen, so a block row opens the
        // property's blocks list — the closest existing destination.
        context.push(
          isBlock
              ? '/properties/$propertyId/blocks'
              : '/properties/$propertyId/units/${asset.unitId}',
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
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
                color: RLTokens.fill,
                borderRadius: BorderRadius.circular(RLTokens.rSm),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Icon(
                isBlock ? Icons.apartment_outlined : Icons.home_outlined,
                size: 17,
                color: RLTokens.inkSoft,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    asset.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 14.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.crimson,
                    ),
                  ),
                  // A unit shows its block as context on its own row — never
                  // as containment, since the two are picked independently.
                  if (!isBlock && blockName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'in $blockName',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 12,
                        color: RLTokens.inkSoft,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(RLTokens.rSm),
                border: Border.all(color: RLTokens.hairline),
              ),
              child: Text(
                isBlock ? 'BLOCK' : 'UNIT',
                style: const TextStyle(
                  fontFamily: RLTokens.fontMono,
                  fontSize: 9.5,
                  fontWeight: RLTokens.bold,
                  letterSpacing: 0.6,
                  color: RLTokens.muted,
                ),
              ),
            ),
            const SizedBox(width: 6),
            const Icon(
              Icons.arrow_forward_rounded,
              size: 15,
              color: RLTokens.micro,
            ),
          ],
        ),
      ),
    );
  }
}

class _WholeProperty extends StatelessWidget {
  const _WholeProperty();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RLLabel('Selected assets'),
        RLCard(
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: RLTokens.fill,
                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                ),
                child: const Icon(
                  Icons.home_outlined,
                  size: 19,
                  color: RLTokens.muted,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Whole property',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'No specific block or unit was selected.',
                      style: TextStyle(
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
      ],
    );
  }
}
