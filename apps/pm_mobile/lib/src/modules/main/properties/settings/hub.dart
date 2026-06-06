import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class PropertySettingsHubScreen extends StatelessWidget {
  const PropertySettingsHubScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLBackHeader(title: 'Property settings'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 10, RLTokens.gutter, 24),
              children: [
                // Property identity card
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
                          child: const Icon(Icons.apartment_outlined, size: 22, color: RLTokens.mutedSoft),
                        ),
                      ),
                      const SizedBox(width: 13),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Cantonments Court',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 18,
                                color: RLTokens.ink,
                                height: 1.1,
                              ),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'Cantonments, Accra',
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
                        onTap: () => context.push('/properties/$id/settings/members'),
                        showDivider: true,
                      ),
                      _TileRowInCard(
                        iconBg: RLTokens.warningBg,
                        iconColor: RLTokens.warning,
                        icon: Icons.description_outlined,
                        title: 'Documents',
                        sub: '3 templates',
                        onTap: () => context.push('/properties/$id/settings/documents'),
                        showDivider: false,
                      ),
                    ],
                  ),
                ),

                _sectionLabel('Danger zone'),
                _TileRow(
                  iconBg: RLTokens.neutralBg,
                  iconColor: RLTokens.inkSoft,
                  icon: Icons.archive_outlined,
                  title: 'Archive property',
                  sub: 'Hide from active portfolio',
                  onTap: () => _showArchiveAlert(context),
                ),
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

  void _showArchiveAlert(BuildContext context) {
    Haptics.vibrate(HapticsType.warning);
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: RLTokens.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Archive property?',
          style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 21, color: RLTokens.ink),
        ),
        content: const Text(
          'The property will be hidden from your active portfolio. You can restore it at any time.',
          style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, color: RLTokens.muted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(
              'Cancel',
              style: TextStyle(fontFamily: RLTokens.fontSans, fontWeight: RLTokens.semibold, color: RLTokens.ink),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text(
              'Archive',
              style: TextStyle(fontFamily: RLTokens.fontSans, fontWeight: RLTokens.semibold, color: RLTokens.danger),
            ),
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
            ? const BoxDecoration(border: Border(bottom: BorderSide(color: RLTokens.hairlineSoft)))
            : null,
        child: _rowContent(iconBg, iconColor, icon, title, sub),
      ),
    );
  }
}

Widget _rowContent(Color iconBg, Color iconColor, IconData icon, String title, String sub) {
  return Row(
    children: [
      Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(11)),
        child: Icon(icon, size: 18, color: iconColor),
      ),
      const SizedBox(width: 13),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
            const SizedBox(height: 2),
            Text(sub, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
          ],
        ),
      ),
      const Icon(Icons.chevron_right_rounded, size: 18, color: RLTokens.micro),
    ],
  );
}
