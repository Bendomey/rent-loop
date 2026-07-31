import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/placeholder_data.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sheets.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/widgets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Security — password, two-factor and the delete-account zone.
///
/// Only the password sheet opens. Two-factor and account deletion are not
/// released yet, so both show a "coming soon" toast.
class AccountSecurityPage extends ConsumerWidget {
  const AccountSecurityPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RLLabel('Sign-in password'),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AccountField(
                label: 'Password',
                value: '••••••••••',
                action: 'Change',
                mono: true,
                onAction: () => showChangePasswordSheet(context),
              ),
              const SizedBox(height: 12),
              const Text(
                'Last changed $kPlaceholderPasswordChanged',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12,
                  color: RLTokens.muted,
                ),
              ),
            ],
          ),
        ),

        const RLLabel('Two-factor authentication'),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RLIconTile(
                icon: Icons.shield_outlined,
                tone: RLTone.neutral,
                size: 40,
              ),
              const SizedBox(width: 13),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            'Authenticator app',
                            style: TextStyle(
                              fontFamily: RLTokens.fontSans,
                              fontSize: 14.5,
                              fontWeight: RLTokens.bold,
                              color: RLTokens.ink,
                            ),
                          ),
                        ),
                        SizedBox(width: 8),
                        RLPill('Coming soon', tone: RLTone.neutral),
                      ],
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Require a code from your phone as well as your password when signing in.',
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
              const SizedBox(width: 8),
              // Stays off until 2FA ships — the switch never changes state.
              Switch.adaptive(
                value: false,
                activeTrackColor: RLTokens.crimson,
                onChanged: (_) =>
                    showAccountComingSoon(ref, 'Two-factor authentication'),
              ),
            ],
          ),
        ),

        const RLLabel('Danger zone'),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: RLTokens.dangerBg,
            borderRadius: BorderRadius.circular(RLTokens.rLg),
            border: Border.all(color: RLTokens.crimsonTint2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Flexible(
                    child: Text(
                      'Delete my account',
                      style: TextStyle(
                        fontFamily: RLTokens.fontSans,
                        fontSize: 14.5,
                        fontWeight: RLTokens.bold,
                        color: RLTokens.ink,
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  RLPill('Coming soon', tone: RLTone.neutral),
                ],
              ),
              const SizedBox(height: 5),
              const Text(
                'Permanently closes your account and removes you from this workspace. Properties you own must be transferred first.',
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.muted,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              RLBtn(
                label: 'Delete account',
                kind: RLBtnKind.danger,
                full: true,
                icon: Icons.warning_amber_rounded,
                onPressed: () => showAccountComingSoon(ref, 'Account deletion'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
