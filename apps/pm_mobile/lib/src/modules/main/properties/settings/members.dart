import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _kMembers = [
  _Member(name: 'Akosua Owusu',     role: 'Owner',   email: 'akosua@owusuestates.com',   phone: '+233 24 558 1190', status: 'Active'),
  _Member(name: 'Jane Mensah',      role: 'Manager', email: 'jane.mensah@gmail.com',      phone: '+233 50 165 2108', status: 'Active'),
  _Member(name: 'Emmanuel Baidoo',  role: 'Staff',   email: 'ebaidoo79@gmail.com',        phone: '+233 50 633 9153', status: 'Active'),
  _Member(name: 'Gideon Bempong',   role: 'Staff',   email: 'gideonbempong533@gmail.com', phone: '+233 27 709 9220', status: 'Invited'),
  _Member(name: 'Edward Adjei',     role: 'Manager', email: 'edd.net49@gmail.com',        phone: '+233 55 860 1966', status: 'Active'),
];

class _Member {
  const _Member({required this.name, required this.role, required this.email, required this.phone, required this.status});
  final String name, role, email, phone, status;
}

Color _statusColor(String s) => switch (s) {
  'Active'  => RLTokens.success,
  'Invited' => RLTokens.warning,
  _         => RLTokens.danger,
};
Color _statusBg(String s) => switch (s) {
  'Active'  => RLTokens.successBg,
  'Invited' => RLTokens.warningBg,
  _         => RLTokens.dangerBg,
};

class PropertyMembersScreen extends StatelessWidget {
  const PropertyMembersScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      floatingActionButton: RLFAB(
        label: 'Add member',
        icon: Icons.add_rounded,
        onPressed: () async {
          await Haptics.vibrate(HapticsType.medium);
          if (context.mounted) context.push('/properties/$id/settings/members/add');
        },
      ),
      body: Column(
        children: [
          RLBackHeader(
            title: 'Members',
            trailing: IconButton(
              icon: const Icon(Icons.add_rounded, size: 22, color: RLTokens.ink),
              onPressed: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) context.push('/properties/$id/settings/members/add');
              },
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 6, RLTokens.gutter, 120),
              children: [
                const Text(
                  'Manage members',
                  style: TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 24, color: RLTokens.ink, letterSpacing: -0.4),
                ),
                const SizedBox(height: 5),
                const Text(
                  'These people have access to this property.',
                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, color: RLTokens.muted),
                ),
                const SizedBox(height: 14),

                // Search bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.search_rounded, size: 18, color: RLTokens.mutedSoft),
                      SizedBox(width: 10),
                      Text('Search members', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14, color: RLTokens.mutedSoft)),
                    ],
                  ),
                ),

                // Section label
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 18, 0, 10),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Team',
                          style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, fontWeight: RLTokens.semibold, color: RLTokens.muted),
                        ),
                      ),
                      Text(
                        '${_kMembers.length} members',
                        style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, fontWeight: RLTokens.semibold, color: RLTokens.crimson),
                      ),
                    ],
                  ),
                ),

                ...List.generate(_kMembers.length, (i) {
                  final m = _kMembers[i];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: RLTokens.surface,
                        borderRadius: BorderRadius.circular(RLTokens.rLg),
                        border: Border.all(color: RLTokens.hairline),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _Avatar(name: m.name, size: 42),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(m.name, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.semibold, color: RLTokens.ink)),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: RLTokens.fill,
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      child: Text(
                                        m.role.toUpperCase(),
                                        style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 9.5, fontWeight: RLTokens.bold, letterSpacing: 0.6, color: RLTokens.muted),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(m.email, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted), overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text(m.phone, style: const TextStyle(fontFamily: RLTokens.fontMono, fontSize: 11.5, color: RLTokens.mutedSoft)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: _statusBg(m.status),
                                  borderRadius: BorderRadius.circular(RLTokens.rPill),
                                ),
                                child: Text(
                                  m.status,
                                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12, fontWeight: RLTokens.semibold, color: _statusColor(m.status)),
                                ),
                              ),
                              const SizedBox(height: 12),
                              GestureDetector(
                                onTap: () => Haptics.vibrate(HapticsType.selection),
                                child: const Icon(Icons.delete_outline_rounded, size: 18, color: RLTokens.micro),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Avatar ────────────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  const _Avatar({required this.name, required this.size});
  final String name;
  final double size;

  String get _initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return parts[0][0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(size / 3),
      ),
      child: Center(
        child: Text(
          _initials,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: size * 0.35,
            fontWeight: RLTokens.bold,
            color: RLTokens.crimson,
          ),
        ),
      ),
    );
  }
}
