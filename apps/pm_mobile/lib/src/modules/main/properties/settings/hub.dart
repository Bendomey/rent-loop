import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class PropertySettingsHubScreen extends ConsumerWidget {
  const PropertySettingsHubScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final propertyAsync = ref.watch(propertyDetailProvider(id));

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'Property settings'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                10,
                RLTokens.gutter,
                24,
              ),
              children: [
                _PropertyIdentityCard(
                  propertyAsync: propertyAsync,
                  onRetry: () => ref.invalidate(propertyDetailProvider(id)),
                ),

                _sectionLabel('General settings'),
                _TileRow(
                  iconBg: RLTokens.crimsonTint,
                  iconColor: RLTokens.crimson,
                  icon: Icons.settings_outlined,
                  title: 'General',
                  sub: 'Name, rental mode, location',
                  onTap: () => context.push('/properties/$id/settings/general'),
                ),

                _sectionLabel('Property settings'),
                Container(
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Column(
                    children: [
                      _TileRowInCard(
                        iconBg: RLTokens.infoBg,
                        iconColor: RLTokens.info,
                        icon: Icons.group_outlined,
                        title: 'Members',
                        sub: '5 people have access',
                        onTap: () =>
                            context.push('/properties/$id/settings/members'),
                        showDivider: true,
                      ),
                      _TileRowInCard(
                        iconBg: RLTokens.warningBg,
                        iconColor: RLTokens.warning,
                        icon: Icons.description_outlined,
                        title: 'Documents',
                        sub: '3 templates',
                        onTap: () =>
                            context.push('/properties/$id/settings/documents'),
                        showDivider: false,
                      ),
                    ],
                  ),
                ),

                _sectionLabel('Danger zone'),
                _DeletePropertyCard(propertyId: id),
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
}

// ── Property identity card (real data) ──────────────────────────────────────

class _PropertyIdentityCard extends StatelessWidget {
  const _PropertyIdentityCard({
    required this.propertyAsync,
    required this.onRetry,
  });
  final AsyncValue<PropertyModel> propertyAsync;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (!propertyAsync.hasValue && propertyAsync.isLoading) {
      return const _PropertyIdentitySkeleton();
    }
    if (propertyAsync.hasError && !propertyAsync.hasValue) {
      return RLCard(child: RLSectionError(compact: true, onRetry: onRetry));
    }

    final property = propertyAsync.value!;
    final location = [
      property.address,
      property.city,
    ].whereType<String>().where((v) => v.isNotEmpty).join(', ');
    final images = property.images ?? const [];
    // The blocks/units stats must always stay fully visible — only the
    // (potentially long) location clips with an ellipsis, in its own
    // Flexible, rather than one combined string where a long address could
    // push the stats off the end entirely.
    final stats =
        '${property.blocksCount} ${property.blocksCount == 1 ? 'block' : 'blocks'} · '
        '${property.unitsCount} ${property.unitsCount == 1 ? 'unit' : 'units'}';

    return Container(
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
            child: SizedBox(
              width: 46,
              height: 46,
              child: images.isNotEmpty
                  ? Image.network(
                      images.first,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => const _PropertyIconTile(),
                      loadingBuilder: (_, child, progress) =>
                          progress == null ? child : const _PropertyIconTile(),
                    )
                  : const _PropertyIconTile(),
            ),
          ),
          const SizedBox(width: 13),
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
                    fontSize: 18,
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

class _PropertyIconTile extends StatelessWidget {
  const _PropertyIconTile();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.fill,
      child: const Icon(
        Icons.apartment_outlined,
        size: 22,
        color: RLTokens.mutedSoft,
      ),
    );
  }
}

class _PropertyIdentitySkeleton extends StatelessWidget {
  const _PropertyIdentitySkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: Container(
        height: 74,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
        ),
      ),
    );
  }
}

// ── Danger zone — delete property card ──────────────────────────────────────

class _DeletePropertyCard extends StatelessWidget {
  const _DeletePropertyCard({required this.propertyId});
  final String propertyId;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        // Matches the Figma spec's DEL_C tokens exactly (rl-del-mobile.jsx):
        // dangerBg 'rgba(200,0,58,0.06)', dangerBd 'rgba(200,0,58,0.22)'.
        color: const Color.fromRGBO(200, 0, 58, 0.06),
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: const Color.fromRGBO(200, 0, 58, 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(
                    color: const Color.fromRGBO(200, 0, 58, 0.22),
                  ),
                ),
                child: const Icon(
                  Icons.delete_outline_rounded,
                  size: 17,
                  color: RLTokens.crimson,
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Delete property',
                style: TextStyle(
                  fontFamily: RLTokens.fontSerif,
                  fontSize: 18,
                  color: RLTokens.ink,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Removes this property and everything under it from your '
            'portfolio. It\'s archived — not erased — so you can restore '
            'it later.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              color: RLTokens.muted,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 14),
          RLBtn(
            label: 'Delete property',
            icon: Icons.delete_outline_rounded,
            kind: RLBtnKind.primary,
            full: true,
            onPressed: () async {
              await Haptics.vibrate(HapticsType.warning);
              if (context.mounted) {
                context.push('/properties/$propertyId/settings/delete');
              }
            },
          ),
        ],
      ),
    );
  }
}

// ── Tile row (standalone card) ─────────────────────────────────────────────────

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
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: _rowContent(iconBg, iconColor, icon, title, sub),
      ),
    );
  }
}

// ── Tile row (inside grouped card) ────────────────────────────────────────────

class _TileRowInCard extends StatelessWidget {
  const _TileRowInCard({
    required this.iconBg,
    required this.iconColor,
    required this.icon,
    required this.title,
    required this.sub,
    required this.onTap,
    required this.showDivider,
  });
  final Color iconBg, iconColor;
  final IconData icon;
  final String title, sub;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: showDivider
            ? const BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: RLTokens.hairlineSoft),
                ),
              )
            : null,
        child: _rowContent(iconBg, iconColor, icon, title, sub),
      ),
    );
  }
}

Widget _rowContent(
  Color iconBg,
  Color iconColor,
  IconData icon,
  String title,
  String sub,
) {
  return Row(
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
      const Icon(Icons.chevron_right_rounded, size: 18, color: RLTokens.micro),
    ],
  );
}
