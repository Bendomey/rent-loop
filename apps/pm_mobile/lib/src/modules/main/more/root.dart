import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/app_startup.dart';
import 'package:rentloop_manager/src/shared/dialogs.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _Header()),
          SliverToBoxAdapter(child: _ProfileCard()),
          SliverToBoxAdapter(child: _SettingsGroup(
            title: 'Account',
            items: [
              _SettingItem(icon: Icons.person_outline, label: 'Profile', onTap: () {}),
              _SettingItem(icon: Icons.business_outlined, label: 'Workspace', onTap: () {}),
              _SettingItem(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () {}),
            ],
          )),
          SliverToBoxAdapter(child: _SettingsGroup(
            title: 'Support',
            items: [
              _SettingItem(icon: Icons.help_outline, label: 'Help center', onTap: () {}),
              _SettingItem(icon: Icons.feedback_outlined, label: 'Send feedback', onTap: () {}),
              _SettingItem(icon: Icons.privacy_tip_outlined, label: 'Privacy policy', onTap: () {}),
            ],
          )),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 8, RLTokens.gutter, 0),
              child: _SettingsGroup(
                title: '',
                items: [
                  _SettingItem(
                    icon: Icons.logout,
                    label: 'Sign out',
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (!context.mounted) return;
                      final confirmed = await showSignOutDialog(context);
                      if (confirmed && context.mounted) {
                        ref.read(appStartupProvider.notifier).logout();
                      }
                    },
                    danger: true,
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.only(top: 24, bottom: 40),
                child: Text(
                  'RentLoop Manager · v0.1.0',
                  style: TextStyle(fontFamily: RLTokens.fontSans, fontSize: 11, color: RLTokens.micro),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Header extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: RLTokens.surface,
      padding: const EdgeInsets.fromLTRB(
        RLTokens.gutter,
        RLTokens.statusTop,
        RLTokens.gutter,
        16,
      ),
      child: Text(
        'More',
        style: TextStyle(fontFamily: RLTokens.fontSerif, 
          fontSize: RLTokens.textTitle,
          color: RLTokens.ink,
          letterSpacing: -0.4,
          height: 1.1,
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(RLTokens.gutter, 16, RLTokens.gutter, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: RLTokens.surface,
        borderRadius: BorderRadius.circular(RLTokens.rLg),
        boxShadow: RLTokens.elev1,
      ),
      child: Row(
        children: [
          RLAvatar('Akosua Owusu', size: 50),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Akosua Owusu',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: RLTokens.textBarTitle,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'akosua@owusuestates.com',
                  style: TextStyle(fontFamily: RLTokens.fontSans, 
                    fontSize: 12.5,
                    color: RLTokens.muted,
                  ),
                ),
                const SizedBox(height: 6),
                RLPill('Owner', tone: RLTone.info),
              ],
            ),
          ),
          RLIconBtn(icon: Icons.edit_outlined, onTap: () {}),
        ],
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.title, required this.items});
  final String title;
  final List<_SettingItem> items;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(RLTokens.gutter, 20, RLTokens.gutter, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title.isNotEmpty) ...[
            Text(
              title.toUpperCase(),
              style: TextStyle(fontFamily: RLTokens.fontSans, 
                fontSize: 10.5,
                fontWeight: RLTokens.semibold,
                letterSpacing: 0.7,
                color: RLTokens.mutedSoft,
              ),
            ),
            const SizedBox(height: 8),
          ],
          Container(
            decoration: BoxDecoration(
              color: RLTokens.surface,
              borderRadius: BorderRadius.circular(RLTokens.rLg),
              boxShadow: RLTokens.elev1,
            ),
            child: Column(
              children: [
                for (var i = 0; i < items.length; i++) ...[
                  if (i > 0)
                    Divider(height: 1, thickness: 1, color: RLTokens.hairlineSoft, indent: 50),
                  items[i],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingItem extends StatelessWidget {
  const _SettingItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
  });
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger ? RLTokens.danger : RLTokens.inkSoft;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: danger ? RLTokens.dangerBg : RLTokens.fill,
                borderRadius: BorderRadius.circular(RLTokens.rSm),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(fontFamily: RLTokens.fontSans, 
                  fontSize: RLTokens.textRowTitle,
                  fontWeight: RLTokens.medium,
                  color: color,
                ),
              ),
            ),
            if (!danger)
              const Icon(Icons.chevron_right, color: RLTokens.micro, size: 18),
          ],
        ),
      ),
    );
  }
}
