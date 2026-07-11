import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/constants.dart';
import 'package:rentloop_manager/src/lib/workspace_resolution.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:url_launcher/url_launcher.dart';

// Call this from the home screen's workspace eyebrow button or the More
// screen's workspace card. The member list and the active selection are
// read off currentUserNotifierProvider / currentWorkspaceNotifierProvider —
// no separate API call, that data was already fetched at login/`/me`.
Future<void> showWorkspaceSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    isScrollControlled: true,
    builder: (_) => const _WorkspaceSheet(),
  );
}

class _WorkspaceSheet extends ConsumerWidget {
  const _WorkspaceSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientUsers =
        ref.watch(currentUserNotifierProvider)?.clientUsers ?? const [];
    final activeClientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(RLTokens.rXl)),
        boxShadow: RLTokens.elevSheet,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 5,
              decoration: BoxDecoration(
                color: RLTokens.hairline,
                borderRadius: BorderRadius.circular(5),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Row(
                children: [
                  Text(
                    'Switch workspace',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      letterSpacing: -0.3,
                      color: RLTokens.ink,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () async {
                      await Haptics.vibrate(HapticsType.selection);
                      if (context.mounted) Navigator.of(context).pop();
                    },
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: RLTokens.fill,
                        borderRadius: BorderRadius.circular(RLTokens.rSm),
                      ),
                      child: const Icon(Icons.close, size: 17, color: RLTokens.inkSoft),
                    ),
                  ),
                ],
              ),
            ),

            // Workspace list
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 4, 14, 0),
              child: Column(
                children: clientUsers.asMap().entries.map((e) {
                  final cu = e.value;
                  final last = e.key == clientUsers.length - 1;
                  final active = isActiveClientUser(cu);
                  final on = cu.clientId == activeClientId;
                  final name = cu.client?.name ?? 'Unknown workspace';
                  final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

                  return Opacity(
                    opacity: active ? 1.0 : 0.5,
                    child: GestureDetector(
                      onTap: active
                          ? () async {
                              await Haptics.vibrate(HapticsType.selection);
                              await ref
                                  .read(currentWorkspaceNotifierProvider.notifier)
                                  .select(cu);
                              await Future.delayed(const Duration(milliseconds: 180));
                              if (context.mounted) Navigator.of(context).pop();
                            }
                          : null,
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
                        decoration: BoxDecoration(
                          border: last ? null : Border(
                            bottom: BorderSide(color: RLTokens.hairlineSoft),
                          ),
                        ),
                        child: Row(
                          children: [
                            // Workspace tile (default 46px)
                            _WsTile(initial: initial),
                            const SizedBox(width: 13),
                            // Name and role
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 15.5,
                                      fontWeight: RLTokens.semibold,
                                      color: RLTokens.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    cu.role,
                                    style: TextStyle(
                                      fontFamily: RLTokens.fontSans,
                                      fontSize: 12.5,
                                      color: RLTokens.muted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Active indicator
                            on
                                ? Container(
                                    width: 24,
                                    height: 24,
                                    decoration: const BoxDecoration(
                                      color: RLTokens.crimson,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.check, size: 14, color: Colors.white),
                                  )
                                : Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(color: RLTokens.hairline, width: 1.5),
                                    ),
                                  ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

            // Create workspace button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  final url = applyUrl(campaign: 'workspace_sheet', content: 'create_workspace');
                  if (await canLaunchUrl(url)) await launchUrl(url, mode: LaunchMode.externalApplication);
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add, size: 18, color: RLTokens.ink),
                      const SizedBox(width: 8),
                      Text(
                        'Create a new workspace',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSans,
                          fontSize: 14.5,
                          fontWeight: RLTokens.semibold,
                          color: RLTokens.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Workspace initials tile ───────────────────────────────────────────────────

class _WsTile extends StatelessWidget {
  const _WsTile({required this.initial});
  final String initial;
  static const double size = 46;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: RLTokens.crimsonTint,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: RLTokens.crimsonTint2),
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontFamily: RLTokens.fontSerif,
            fontSize: size * 0.36,
            color: RLTokens.crimson,
            letterSpacing: 0.3,
            height: 1,
          ),
        ),
      ),
    );
  }
}
