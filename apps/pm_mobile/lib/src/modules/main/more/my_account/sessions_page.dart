import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';

import 'package:rentloop_manager/src/modules/main/more/my_account/sheets.dart';
import 'package:rentloop_manager/src/repository/models/session_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/auth/revoke_session_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/sessions_provider.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Sessions — every signed-in device, revoke one or all others.
///
/// Backed by `GET /users/me/sessions`. Revoking is immediate server-side: the
/// auth middleware checks the session on every request, so a signed-out device
/// stops working at once rather than when its access token expires.
const _pagePadding = EdgeInsets.fromLTRB(
  RLTokens.gutter,
  0,
  RLTokens.gutter,
  40,
);

class AccountSessionsPage extends ConsumerWidget {
  const AccountSessionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(sessionsProvider);

    // hasValue/isLoading rather than .when(): the skeleton belongs to the
    // first load only, never to a pull-to-refresh over data already on screen.
    if (!sessionsAsync.hasValue && sessionsAsync.isLoading) {
      return const _SessionsSkeleton();
    }

    if (sessionsAsync.hasError && !sessionsAsync.hasValue) {
      return Padding(
        padding: _pagePadding,
        child: RLSectionError(
          title: "Couldn't load your sessions",
          onRetry: () => ref.invalidate(sessionsProvider),
        ),
      );
    }

    final sessions = sessionsAsync.valueOrNull ?? const <SessionModel>[];
    final others = sessions.where((s) => !s.isCurrent).length;

    return RefreshIndicator(
      color: RLTokens.crimson,
      onRefresh: () => ref.refresh(sessionsProvider.future),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        // This page scrolls itself, so it owns the gutter the account shell
        // applies to the non-scrolling pages.
        padding: _pagePadding,
        children: [
          const SizedBox(height: 8),
          RLCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const RLIconTile(
                      icon: Icons.lock_outline_rounded,
                      tone: RLTone.neutral,
                      size: 40,
                    ),
                    const SizedBox(width: 13),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${sessions.length} active '
                            '${sessions.length == 1 ? 'session' : 'sessions'}',
                            style: const TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 14.5,
                              fontWeight: RLTokens.bold,
                              color: RLTokens.ink,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Everywhere you’re signed in. If you don’t recognise '
                            'something, sign it out and change your password.',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 12.5,
                              color: RLTokens.muted,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (others > 0) ...[
                  const SizedBox(height: 14),
                  RLBtn(
                    label: 'Sign out all others ($others)',
                    kind: RLBtnKind.danger,
                    full: true,
                    icon: Icons.warning_amber_rounded,
                    onPressed: () => showSignOutOthersSheet(
                      context,
                      count: others,
                      onConfirm: () => _revokeOthers(context, ref),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const RLLabel('Signed-in devices'),
          RLCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            child: Column(
              children: [
                for (var i = 0; i < sessions.length; i++)
                  _SessionRow(
                    session: sessions[i],
                    last: i == sessions.length - 1,
                    onSignOut: () => showSignOutDeviceSheet(
                      context,
                      deviceLabel: sessions[i].displayName,
                      where: sessions[i].locationCity,
                      lastUsed: sessions[i].ipAddress,
                      deviceKind: sessions[i].deviceKind,
                      onConfirm: () => _revokeOne(context, ref, sessions[i].id),
                    ),
                  ),
                if (sessions.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Text(
                      'No active sessions.',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 13,
                        color: RLTokens.muted,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          if (others == 0 && sessions.isNotEmpty)
            const Padding(
              padding: EdgeInsets.fromLTRB(0, 18, 0, 4),
              child: Center(
                child: Text(
                  'All other sessions have been signed out.',
                  style: TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    color: RLTokens.muted,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Future<void> _revokeOne(
    BuildContext context,
    WidgetRef ref,
    String sessionId,
  ) async {
    final notifier = ref.read(revokeSessionNotifierProvider.notifier);
    await notifier.revoke(sessionId);
    if (!context.mounted) return;

    final state = ref.read(revokeSessionNotifierProvider);
    if (state.status.isFailed()) {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: 'Could not sign out that device',
        body: state.errorMessage,
      );
      return;
    }

    showRLToast(ref, tone: RLToastTone.success, title: 'Device signed out');
    ref.invalidate(sessionsProvider);
  }

  Future<void> _revokeOthers(BuildContext context, WidgetRef ref) async {
    final notifier = ref.read(revokeSessionNotifierProvider.notifier);
    await notifier.revokeOthers();
    if (!context.mounted) return;

    final state = ref.read(revokeSessionNotifierProvider);
    if (state.status.isFailed()) {
      showRLToast(
        ref,
        tone: RLToastTone.error,
        title: 'Could not sign out other sessions',
        body: state.errorMessage,
      );
      return;
    }

    // The server counts what it actually ended — the list may have been stale.
    final count = state.revokedCount;
    showRLToast(
      ref,
      tone: RLToastTone.success,
      title: 'Signed out $count other ${count == 1 ? 'session' : 'sessions'}',
    );
    ref.invalidate(sessionsProvider);
  }
}

class _SessionRow extends StatelessWidget {
  const _SessionRow({
    required this.session,
    required this.last,
    required this.onSignOut,
  });

  final SessionModel session;
  final bool last;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final context_ = session.displayContext;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 15),
      decoration: BoxDecoration(
        border: last
            ? null
            : const Border(bottom: BorderSide(color: RLTokens.hairlineSoft)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RLIconTile(
            icon: deviceIconFor(session.deviceKind),
            tone: session.isCurrent ? RLTone.success : RLTone.neutral,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  session.displayName,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 14,
                    fontWeight: RLTokens.bold,
                    color: RLTokens.ink,
                    height: 1.3,
                  ),
                ),
                if (context_.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    context_,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 12,
                      color: RLTokens.muted,
                    ),
                  ),
                ],
                if (session.ipAddress != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    session.ipAddress!,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontMono,
                      fontSize: 10.5,
                      color: RLTokens.micro,
                    ),
                  ),
                ],
                const SizedBox(height: 9),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (session.isCurrent)
                      const RLPill('This device', tone: RLTone.success)
                    else
                      RLBtn(
                        label: 'Sign out',
                        kind: RLBtnKind.danger,
                        large: false,
                        icon: Icons.logout_rounded,
                        onPressed: onSignOut,
                      ),
                    // The place came from the device itself, so it is labelled
                    // as reported rather than shown as verified.
                    if (session.isClientReportedLocation)
                      const RLPill('Reported by device', tone: RLTone.neutral),
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

class _SessionsSkeleton extends StatelessWidget {
  const _SessionsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: RLTokens.fill,
      highlightColor: RLTokens.paper,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: _pagePadding,
        children: [
          const SizedBox(height: 8),
          _skeletonBlock(height: 118),
          const SizedBox(height: 26),
          _skeletonBlock(height: 300),
        ],
      ),
    );
  }

  Widget _skeletonBlock({required double height}) => Container(
    height: height,
    decoration: BoxDecoration(
      color: RLTokens.fill,
      borderRadius: BorderRadius.circular(RLTokens.rLg),
    ),
  );
}
