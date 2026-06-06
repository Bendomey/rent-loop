import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

/// Shows a confirmation dialog before signing out.
/// Returns true if the user confirmed, false if they cancelled.
Future<bool> showSignOutDialog(BuildContext context) async {
  await Haptics.vibrate(HapticsType.warning);

  if (!context.mounted) return false;

  final confirmed = await showDialog<bool>(
    context: context,
    barrierColor: const Color.fromRGBO(17, 17, 16, 0.35),
    builder: (ctx) => AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(RLTokens.rXl),
      ),
      contentPadding: const EdgeInsets.fromLTRB(24, 28, 24, 0),
      actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sign out?',
            style: TextStyle(
              fontFamily: RLTokens.fontSerif,
              fontSize: 22,
              letterSpacing: -0.3,
              color: RLTokens.ink,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'You\'ll need to sign in again to access your workspace.',
            style: TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 14,
              color: RLTokens.muted,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 4),
        ],
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.selection);
                  if (ctx.mounted) Navigator.of(ctx).pop(false);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: Text(
                      'Cancel',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.semibold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: () async {
                  await Haptics.vibrate(HapticsType.heavy);
                  if (ctx.mounted) Navigator.of(ctx).pop(true);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: RLTokens.crimson,
                    borderRadius: BorderRadius.circular(RLTokens.rMd),
                  ),
                  child: Center(
                    child: Text(
                      'Sign out',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 15,
                        fontWeight: RLTokens.semibold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    ),
  );

  return confirmed == true;
}
