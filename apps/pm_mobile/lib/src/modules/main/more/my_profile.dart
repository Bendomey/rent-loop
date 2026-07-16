import 'package:flutter/material.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

class MyProfileScreen extends StatelessWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RLTokens.surface,
      body: Column(
        children: [
          RLBackHeader(
            title: 'My profile',
            onBack: () async {
              await Haptics.vibrate(HapticsType.selection);
              if (context.mounted) Navigator.of(context).pop();
            },
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Heading ──────────────────────────────────────────────
                  const Text(
                    'My profile',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 25,
                      color: RLTokens.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                  Container(
                    height: 1,
                    color: RLTokens.hairlineSoft,
                    margin: const EdgeInsets.only(top: 14, bottom: 20),
                  ),

                  // ── Avatar ───────────────────────────────────────────────
                  Container(
                    width: 84,
                    height: 84,
                    decoration: const BoxDecoration(
                      color: RLTokens.crimson,
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Text(
                        'BD',
                        style: TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 30,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Personal info ────────────────────────────────────────
                  const _EditRow(
                    label: 'Full name',
                    value: 'Benjamin Domey',
                    action: 'Change name',
                  ),

                  // ── Account security section ─────────────────────────────
                  const SizedBox(height: 14),
                  const Text(
                    'Account security',
                    style: TextStyle(
                      fontFamily: RLTokens.fontSerif,
                      fontSize: 21,
                      color: RLTokens.ink,
                      letterSpacing: -0.3,
                    ),
                  ),
                  Container(
                    height: 1,
                    color: RLTokens.hairlineSoft,
                    margin: const EdgeInsets.only(top: 6, bottom: 20),
                  ),

                  const _EditRow(
                    label: 'Email',
                    value: 'domeybenjamin1@gmail.com',
                    action: 'Change email',
                  ),
                  const _EditRow(
                    label: 'Password',
                    value: '••••••••',
                    action: 'Change password',
                    mono: true,
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

// ── Editable field row ────────────────────────────────────────────────────────

class _EditRow extends StatelessWidget {
  const _EditRow({
    required this.label,
    required this.value,
    required this.action,
    this.mono = false,
  });
  final String label;
  final String value;
  final String action;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontFamily: RLTokens.fontSans,
              fontSize: 13.5,
              fontWeight: RLTokens.semibold,
              color: RLTokens.ink,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 13,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: RLTokens.hairline, width: 1.5),
                  ),
                  child: Text(
                    value,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: mono ? RLTokens.fontMono : RLTokens.fontSans,
                      fontSize: 14.5,
                      color: RLTokens.muted,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () => Haptics.vibrate(HapticsType.selection),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 15,
                    vertical: 13,
                  ),
                  decoration: BoxDecoration(
                    color: RLTokens.fill,
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: Text(
                    action,
                    style: const TextStyle(
                      fontFamily: RLTokens.fontSans,
                      fontSize: 13.5,
                      fontWeight: RLTokens.semibold,
                      color: RLTokens.ink,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
