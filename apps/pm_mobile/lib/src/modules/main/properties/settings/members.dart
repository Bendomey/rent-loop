import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class _Member {
  const _Member({required this.id, required this.name, required this.email, required this.role, required this.initials, this.isYou = false});
  final String id, name, email, role, initials;
  final bool isYou;
}

const _kMembers = [
  _Member(id: 'm1', name: 'Akosua Owusu',   email: 'akosua@owusuest.com',  role: 'Owner',   initials: 'AO', isYou: true),
  _Member(id: 'm2', name: 'Kofi Asante',    email: 'kofi@owusuest.com',    role: 'Manager', initials: 'KA'),
  _Member(id: 'm3', name: 'Ama Boah',       email: 'ama@owusuest.com',     role: 'Staff',   initials: 'AB'),
];

RLTone _roleTone(String role) => switch (role) {
  'Owner'   => RLTone.danger,
  'Manager' => RLTone.info,
  'Staff'   => RLTone.neutral,
  _         => RLTone.neutral,
};

class PropertyMembersScreen extends StatelessWidget {
  const PropertyMembersScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'Members',
            trailing: RLIconBtn(
              icon: Icons.person_add_outlined,
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                if (context.mounted) context.push('/properties/$id/settings/members/add');
              },
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 12, RLTokens.gutter, 40),
              children: [
                // Info banner
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: RLTokens.infoBg,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, size: 16, color: RLTokens.info),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Members have access to this property only. Manage workspace-wide roles in Organisation settings.',
                          style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.info, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Members list
                Container(
                  decoration: BoxDecoration(
                    color: RLTokens.surface,
                    borderRadius: BorderRadius.circular(RLTokens.rLg),
                    border: Border.all(color: RLTokens.hairline),
                  ),
                  child: Column(
                    children: List.generate(_kMembers.length, (i) {
                      final m      = _kMembers[i];
                      final isLast = i == _kMembers.length - 1;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          border: isLast ? null : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
                        ),
                        child: Row(
                          children: [
                            _InitialAvatar(initials: m.initials, isOwner: m.role == 'Owner'),
                            const SizedBox(width: 13),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        m.name,
                                        style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 14.5, fontWeight: RLTokens.semibold, color: RLTokens.ink),
                                      ),
                                      if (m.isYou) ...[
                                        const SizedBox(width: 6),
                                        Text('you', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11, color: RLTokens.mutedSoft)),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(m.email, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 12.5, color: RLTokens.muted)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                RLPill(m.role, tone: _roleTone(m.role)),
                                if (!m.isYou && m.role != 'Owner') ...[
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: () async {
                                      await Haptics.vibrate(HapticsType.selection);
                                      if (context.mounted) _showMemberMenu(context, m);
                                    },
                                    child: const Icon(Icons.more_horiz_rounded, size: 18, color: RLTokens.micro),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 20),

                // Invite button
                GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (context.mounted) context.push('/properties/$id/settings/members/add');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(RLTokens.rMd),
                      border: Border.all(color: RLTokens.hairline),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.person_add_outlined, size: 18, color: RLTokens.crimson),
                        SizedBox(width: 8),
                        Text('Invite member', style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.semibold, color: RLTokens.crimson)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showMemberMenu(BuildContext context, _Member m) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: RLTokens.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(m.name, style: const TextStyle(fontFamily: RLTokens.fontSerif, fontSize: 20, color: RLTokens.ink)),
              const SizedBox(height: 4),
              Text(m.role, style: const TextStyle(fontFamily: RLTokens.fontSans, fontSize: 13, color: RLTokens.muted)),
              const SizedBox(height: 20),
              _SheetAction(icon: Icons.swap_horiz_rounded, label: 'Change role', onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 4),
              _SheetAction(icon: Icons.person_remove_outlined, label: 'Remove from property', danger: true, onTap: () => Navigator.of(ctx).pop()),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _InitialAvatar extends StatelessWidget {
  const _InitialAvatar({required this.initials, required this.isOwner});
  final String initials;
  final bool   isOwner;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: isOwner ? RLTokens.crimsonTint : RLTokens.fill,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            fontFamily: RLTokens.fontSans,
            fontSize: 14,
            fontWeight: RLTokens.semibold,
            color: isOwner ? RLTokens.crimson : RLTokens.inkSoft,
          ),
        ),
      ),
    );
  }
}

class _SheetAction extends StatelessWidget {
  const _SheetAction({required this.icon, required this.label, required this.onTap, this.danger = false});
  final IconData icon;
  final String   label;
  final bool     danger;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = danger ? RLTokens.danger : RLTokens.ink;
    return GestureDetector(
      onTap: () async {
        await Haptics.vibrate(HapticsType.selection);
        onTap();
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 14),
            Text(label, style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 15, fontWeight: RLTokens.medium, color: color)),
          ],
        ),
      ),
    );
  }
}
