import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/app_startup/app_startup_notifier.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/sessions_provider.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/profile_page.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/security_page.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sessions_page.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sheets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// My Account — the mobile counterpart of the web portal's
/// Settings › My Account redesign.
///
/// The hub lists three categories; each pushes its own page rather than
/// one long scroll:
///   Profile  — photo, name, email
///   Security — password, two-factor, delete account
///   Sessions — every signed-in device, revoke one or all
///
/// UI only — see placeholder_data.dart for what still needs an API.
class MyAccountScreen extends ConsumerWidget {
  const MyAccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserNotifierProvider);
    final name = user?.name ?? 'Manager';
    final email = user?.email ?? '';
    final role = user?.clientUsers.isNotEmpty == true
        ? user!.clientUsers.first.role
        : null;
    final initials = _initials(name);
    // Watched rather than read: the hub rebuilds when a device is revoked on
    // the Sessions page, so the count never lags behind the list.
    final sessionCount = ref.watch(sessionsProvider).valueOrNull?.length;

    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: Column(
        children: [
          RLBackHeader(
            title: 'My account',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                RLTokens.gutter,
                0,
                RLTokens.gutter,
                40,
              ),
              children: [
                const SizedBox(height: 8),

                // ── Identity card ──────────────────────────────────────────
                RLCard(
                  padding: const EdgeInsets.all(18),
                  child: Row(
                    children: [
                      Container(
                        width: 58,
                        height: 58,
                        decoration: const BoxDecoration(
                          color: RLTokens.crimson,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            initials,
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSerif,
                              fontSize: 21,
                              color: Colors.white,
                              height: 1,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSerif,
                                fontSize: 20,
                                color: RLTokens.ink,
                                letterSpacing: -0.2,
                                height: 1.15,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              email,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontFamily: RLTokens.fontSans,
                                fontSize: 12.5,
                                color: RLTokens.muted,
                              ),
                            ),
                            if (role != null) ...[
                              const SizedBox(height: 7),
                              RLPill(role, tone: RLTone.neutral),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Categories ─────────────────────────────────────────────
                const RLLabel('Manage your account'),
                RLCard(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 4,
                  ),
                  child: Column(
                    children: [
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.person_outline_rounded,
                          tone: RLTone.danger,
                        ),
                        title: 'Profile',
                        subtitle: 'Photo, name and email',
                        onTap: () => _push(
                          context,
                          'Profile',
                          AccountProfilePage(
                            name: name,
                            email: email,
                            initials: initials,
                          ),
                        ),
                      ),
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.shield_outlined,
                          tone: RLTone.info,
                        ),
                        title: 'Security',
                        subtitle: 'Password · 2FA coming soon',
                        onTap: () => _push(
                          context,
                          'Security',
                          const AccountSecurityPage(),
                        ),
                      ),
                      RLRow(
                        leading: const RLIconTile(
                          icon: Icons.lock_outline_rounded,
                          tone: RLTone.warning,
                        ),
                        title: 'Sessions',
                        // Live count, so the hub can't disagree with the page
                        // it opens. Null while loading rather than a guess.
                        subtitle: sessionCount == null
                            ? 'Signed-in devices'
                            : '$sessionCount signed-in ${sessionCount == 1 ? 'device' : 'devices'}',
                        last: true,
                        // Owns its own ListView for pull-to-refresh, so the
                        // shell must not wrap it in a second scroll view.
                        onTap: () => _push(
                          context,
                          'Sessions',
                          const AccountSessionsPage(),
                          scrollable: false,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
                RLBtn(
                  label: 'Sign out of this device',
                  kind: RLBtnKind.light,
                  full: true,
                  icon: Icons.logout_rounded,
                  onPressed: () => showSignOutSelfSheet(
                    context,
                    onConfirm: () =>
                        ref.read(appStartupNotifierProvider.notifier).logout(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static void _push(
    BuildContext context,
    String title,
    Widget body, {
    bool scrollable = true,
  }) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            _AccountSubPage(title: title, body: body, scrollable: scrollable),
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.split(' ').where((s) => s.isNotEmpty).take(2);
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }
}

/// Shared chrome for the three category pages.
///
/// Most bodies are plain [Column]s and lean on the scroll view here. A body
/// that scrolls itself (pull-to-refresh needs its own [ListView]) must pass
/// `scrollable: false` — nesting one scrollable inside another leaves the
/// inner one with unbounded height and fails layout.
class _AccountSubPage extends StatelessWidget {
  const _AccountSubPage({
    required this.title,
    required this.body,
    this.scrollable = true,
  });

  final String title;
  final Widget body;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.paper,
      body: Column(
        children: [
          RLBackHeader(
            title: title,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: scrollable
                ? SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(
                      RLTokens.gutter,
                      0,
                      RLTokens.gutter,
                      40,
                    ),
                    child: body,
                  )
                : body,
          ),
        ],
      ),
    );
  }
}
