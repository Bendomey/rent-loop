import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Generic empty/coming-soon screen for features not yet built.
class RLComingSoon extends StatelessWidget {
  const RLComingSoon({super.key, required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: title,
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          const Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.construction_rounded, size: 40, color: RLTokens.hairline),
                  SizedBox(height: 14),
                  Text(
                    'Coming soon',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 20,
                      color: RLTokens.muted,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'This feature is under construction.',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13,
                      color: RLTokens.mutedSoft,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
