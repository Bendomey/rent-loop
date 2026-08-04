import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// Two-factor auth, email updates and account deletion are built but not
/// released. Their controls stay visible and say so instead of doing
/// anything — same treatment as the web portal.
void showAccountComingSoon(WidgetRef ref, String feature) {
  showRLToast(
    ref,
    tone: RLToastTone.info,
    title: '$feature is coming soon',
    body: 'We’re still building this. It’ll land in an upcoming release.',
  );
}

/// Label above, value + trailing action button below. Used by the Profile
/// and Security pages.
class AccountField extends StatelessWidget {
  const AccountField({
    super.key,
    required this.label,
    required this.value,
    required this.action,
    required this.onAction,
    this.badge,
    this.mono = false,
  });

  final String label;
  final String value;
  final String action;
  final VoidCallback onAction;
  final Widget? badge;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontFamily: RLTokens.fontMono,
            fontSize: 10,
            letterSpacing: 0.6,
            color: RLTokens.mutedSoft,
          ),
        ),
        const SizedBox(height: 7),
        Row(
          children: [
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      value,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: mono
                            ? RLTokens.fontMono
                            : RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  if (badge != null) ...[const SizedBox(width: 8), badge!],
                ],
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () async {
                await Haptics.vibrate(HapticsType.selection);
                onAction();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 13,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: RLTokens.surface,
                  borderRadius: BorderRadius.circular(RLTokens.rSm),
                  border: Border.all(color: RLTokens.hairline),
                ),
                child: Text(
                  action,
                  style: const TextStyle(
                    fontFamily: RLTokens.fontSans,
                    fontSize: 13,
                    fontWeight: RLTokens.semibold,
                    color: RLTokens.ink,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
