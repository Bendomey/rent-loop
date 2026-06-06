import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// Reuse prop data from detail screen (mirrors the same seed).
class _P {
  const _P({required this.id, required this.name, required this.type, required this.area, required this.status});
  final String id, name, type, area, status;
}

const _kProps = [
  _P(id: 'p1', name: 'Cantonments Court',  type: 'Apartments', area: 'Cantonments, Accra',  status: 'Active'),
  _P(id: 'p2', name: 'Spintex Heights',     type: 'Apartments', area: 'Spintex Road, Accra', status: 'Active'),
  _P(id: 'p3', name: 'Labadi Beach Suites', type: 'Serviced',   area: 'Labadi, Accra',       status: 'Active'),
  _P(id: 'p4', name: 'East Legon Villa',    type: 'House',      area: 'East Legon, Accra',   status: 'Active'),
  _P(id: 'p5', name: 'Osu Retail Block',    type: 'Commercial', area: 'Oxford St, Osu',      status: 'Draft'),
];

class _MenuItem {
  const _MenuItem({required this.icon, required this.bg, required this.fg, required this.label, required this.sub, required this.route});
  final IconData icon;
  final Color    bg, fg;
  final String   label, sub, route;
}

class PropertySettingsHubScreen extends StatelessWidget {
  const PropertySettingsHubScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    final p = _kProps.firstWhere((x) => x.id == id, orElse: () => _kProps.first);

    final items = [
      _MenuItem(
        icon: Icons.tune_rounded,
        bg: RLTokens.infoBg, fg: RLTokens.info,
        label: 'General settings',
        sub: 'Name, type, address, status',
        route: '/properties/$id/settings/general',
      ),
      _MenuItem(
        icon: Icons.people_outline_rounded,
        bg: RLTokens.successBg, fg: RLTokens.success,
        label: 'Members',
        sub: '3 members with access',
        route: '/properties/$id/settings/members',
      ),
      _MenuItem(
        icon: Icons.folder_outlined,
        bg: RLTokens.warningBg, fg: RLTokens.warning,
        label: 'Documents',
        sub: '4 property documents',
        route: '/properties/$id/settings/documents',
      ),
    ];

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(title: 'Property settings'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 8, RLTokens.gutter, 40),
              children: [
                // Property identity card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: RLTokens.ink,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(20),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          _typeIcon(p.type),
                          size: 24,
                          color: Colors.white.withAlpha(200),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 20,
                                color: Colors.white,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${p.type} · ${p.area}',
                              style: TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: Colors.white.withAlpha(150),
                              ),
                            ),
                          ],
                        ),
                      ),
                      RLPill(
                        p.status,
                        tone: p.status == 'Active' ? RLTone.success : RLTone.neutral,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Menu items
                Container(
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Column(
                    children: List.generate(items.length, (i) {
                      final item   = items[i];
                      final isLast = i == items.length - 1;
                      return GestureDetector(
                        onTap: () async {
                          await Haptics.vibrate(HapticsType.selection);
                          if (context.mounted) context.push(item.route);
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            border: isLast ? null : const Border(
                              bottom: BorderSide(color: RLTokens.hairlineSoft),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: item.bg,
                                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                                ),
                                child: Icon(item.icon, size: 19, color: item.fg),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.label,
                                      style: const TextStyle(
                                        fontFamily: RLTokens.fontSans,
                                        fontSize: 15,
                                        fontWeight: RLTokens.semibold,
                                        color: RLTokens.ink,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      item.sub,
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
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 20),

                // Danger zone
                _DangerZone(propName: p.name),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static IconData _typeIcon(String type) => switch (type) {
    'Apartments' => Icons.apartment_rounded,
    'Serviced'   => Icons.hotel_rounded,
    'House'      => Icons.house_rounded,
    'Commercial' => Icons.store_rounded,
    _            => Icons.business_rounded,
  };
}

class _DangerZone extends StatelessWidget {
  const _DangerZone({required this.propName});
  final String propName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.dangerBg,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.danger.withAlpha(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Danger zone',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13,
              fontWeight: RLTokens.bold,
              color: RLTokens.danger,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.warning);
              if (context.mounted) {
                await _confirmArchive(context, propName);
              }
            },
            behavior: HitTestBehavior.opaque,
            child: Row(
              children: [
                const Icon(Icons.archive_outlined, size: 18, color: RLTokens.danger),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Archive property',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.danger,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Hides the property from active listings.',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 12.5,
                          color: RLTokens.danger,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, size: 18, color: RLTokens.danger),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmArchive(BuildContext context, String name) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(RLTokens.rLg)),
        title: const Text('Archive property?', style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20)),
        content: Text(
          '$name will be hidden from active listings. You can restore it later.',
          style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, color: RLTokens.muted, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(fontFamily: RLTokens.fontSans, color: RLTokens.muted)),
          ),
          TextButton(
            onPressed: () async {
              await Haptics.vibrate(HapticsType.warning);
              if (ctx.mounted) Navigator.of(ctx).pop();
            },
            child: const Text('Archive', style: TextStyle(fontFamily: RLTokens.fontSans, color: RLTokens.danger, fontWeight: RLTokens.semibold)),
          ),
        ],
      ),
    );
  }
}
