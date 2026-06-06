import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/shared/dialogs.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

// ── Seed data ─────────────────────────────────────────────────────────────────

const _kManagerName = 'Akosua Owusu';
const _kWsName      = 'Owusu Estates';
const _kWsInitial   = 'OE';
const _kWsRole      = 'Manager';
const _kWsProps     = 5;
const _kWsUnits     = 64;

// ── Row item model ────────────────────────────────────────────────────────────

class _RowItem {
  const _RowItem({required this.label, required this.sub, required this.icon, required this.bg, required this.fg, this.route});
  final String   label;
  final String   sub;
  final IconData icon;
  final Color    bg;
  final Color    fg;
  final String?  route;
}

// ── Screen ────────────────────────────────────────────────────────────────────

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manageRows = [
      const _RowItem(label: 'Tenants',             sub: 'Directory & profiles',   icon: Icons.people_outline_rounded,   bg: RLTokens.infoBg,     fg: RLTokens.info),
      const _RowItem(label: 'Announcements',       sub: 'Notices & polls',         icon: Icons.campaign_outlined,        bg: RLTokens.crimsonTint, fg: RLTokens.crimson, route: '/more/announcements'),
      const _RowItem(label: 'Documents & e-sign',  sub: 'Agreements, audit trail', icon: Icons.description_outlined,     bg: RLTokens.warningBg,  fg: RLTokens.warning),
      const _RowItem(label: 'Reports',             sub: 'Workspace analytics',     icon: Icons.bar_chart_rounded,        bg: RLTokens.successBg,  fg: RLTokens.success),
    ];

    final orgRows = [
      const _RowItem(label: 'Members & roles',     sub: '5 members',              icon: Icons.person_outline_rounded,   bg: RLTokens.neutralBg,  fg: RLTokens.neutral),
      const _RowItem(label: 'Payment accounts',    sub: 'MoMo · Bank transfer',   icon: Icons.credit_card_outlined,     bg: RLTokens.successBg,  fg: RLTokens.success),
      const _RowItem(label: 'Agreement templates', sub: '3 templates',             icon: Icons.folder_outlined,          bg: RLTokens.infoBg,     fg: RLTokens.info),
      const _RowItem(label: 'Billing',             sub: 'Growth plan',             icon: Icons.receipt_long_outlined,   bg: RLTokens.warningBg,  fg: RLTokens.warning),
    ];

    final accountRows = [
      const _RowItem(label: 'Settings',            sub: 'Notifications, language', icon: Icons.settings_outlined,        bg: RLTokens.neutralBg,  fg: RLTokens.neutral),
      const _RowItem(label: 'Help & support',      sub: 'WhatsApp us',             icon: Icons.help_outline_rounded,     bg: RLTokens.neutralBg,  fg: RLTokens.neutral),
    ];

    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          const RLTopHeader(title: 'More'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 0, RLTokens.gutter, 40),
              children: [
                const SizedBox(height: 10),
                _ProfileCard(),
                RLLabel('Workspace'),
                _WorkspaceCard(),
                RLLabel('Manage'),
                _RowGroup(rows: manageRows),
                RLLabel('Organisation settings'),
                _RowGroup(rows: orgRows),
                RLLabel('Account'),
                _RowGroup(rows: accountRows),
                const SizedBox(height: 6),
                // Log out button
                GestureDetector(
                  onTap: () async {
                    await Haptics.vibrate(HapticsType.selection);
                    if (!context.mounted) return;
                    final confirmed = await showSignOutDialog(context);
                    if (confirmed && context.mounted) {
                      ref.read(appStartupProvider.notifier).logout();
                    }
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(color: RLTokens.hairline),
                      borderRadius: BorderRadius.circular(RLTokens.rLg),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.logout_rounded, size: 18, color: RLTokens.crimson),
                        SizedBox(width: 8),
                        Text(
                          'Log out',
                          style: TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.crimson,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Center(
                  child: Text(
                    'Rentloop · Manager v2.4 · Accra',
                    style: TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 10.5,
                      color: RLTokens.micro,
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
}

// ── Profile card ──────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async => Haptics.vibrate(HapticsType.selection),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: const Row(
          children: [
            RLAvatar(_kManagerName, size: 54, crimsonTone: true),
            SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _kManagerName,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 20,
                      color: RLTokens.ink,
                      height: 1.1,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Personal account',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, size: 18, color: RLTokens.micro),
          ],
        ),
      ),
    );
  }
}

// ── Workspace card ────────────────────────────────────────────────────────────

class _WorkspaceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async => Haptics.vibrate(HapticsType.selection),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: RLTokens.surface,
          borderRadius: BorderRadius.circular(RLTokens.rLg),
          border: Border.all(color: RLTokens.hairline),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: RLTokens.ink,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(
                child: Text(
                  _kWsInitial,
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _kWsName,
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 15.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    '$_kWsRole · $_kWsProps properties · $_kWsUnits units',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            const Row(
              children: [
                Text(
                  'Switch',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.crimson,
                  ),
                ),
                SizedBox(width: 3),
                Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: RLTokens.crimson),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Row group ─────────────────────────────────────────────────────────────────

class _RowGroup extends StatelessWidget {
  const _RowGroup({required this.rows});
  final List<_RowItem> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        border: Border.all(color: RLTokens.hairline),
      ),
      child: Column(
        children: List.generate(rows.length, (i) {
          final r      = rows[i];
          final isLast = i == rows.length - 1;
          return GestureDetector(
            onTap: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (r.route != null && context.mounted) context.push(r.route!);
            },
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
              decoration: BoxDecoration(
                border: isLast
                    ? null
                    : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: r.bg,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(r.icon, size: 18, color: r.fg),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r.label,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 14.5,
                            fontWeight: RLTokens.semibold,
                            color: RLTokens.ink,
                          ),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          r.sub,
                          style: const TextStyle(
                            fontFamily: RLTokens.fontSans,
                            fontSize: 12,
                            color: RLTokens.muted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, size: 17, color: RLTokens.micro),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
