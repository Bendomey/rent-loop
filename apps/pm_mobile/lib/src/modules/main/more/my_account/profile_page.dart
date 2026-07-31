import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:haptic_feedback/haptic_feedback.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/placeholder_data.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sheets.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/widgets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Profile — photo, name and email.
///
/// Name changes open a sheet (UI only). Email updates are not released yet,
/// so that row shows a "coming soon" toast instead.
class AccountProfilePage extends ConsumerWidget {
  const AccountProfilePage({
    super.key,
    required this.name,
    required this.email,
    required this.initials,
  });

  final String name;
  final String email;
  final String initials;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 88,
                    height: 88,
                    decoration: const BoxDecoration(
                      color: RLTokens.crimson,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        initials,
                        style: const TextStyle(
                          fontFamily: RLTokens.fontSerif,
                          fontSize: 31,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: -2,
                    bottom: -2,
                    child: GestureDetector(
                      onTap: () async {
                        await Haptics.vibrate(HapticsType.selection);
                        if (context.mounted) showUploadPhotoSheet(context);
                      },
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: RLTokens.surface,
                          shape: BoxShape.circle,
                          border: Border.all(color: RLTokens.hairline),
                          boxShadow: RLTokens.elev1,
                        ),
                        child: const Icon(
                          Icons.photo_camera_outlined,
                          size: 16,
                          color: RLTokens.ink,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const Text(
                'Square image, at least 200×200px. JPG or PNG, up to 2MB.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: RLTokens.fontSans,
                  fontSize: 12.5,
                  color: RLTokens.muted,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: RLBtn(
                      label: 'Upload photo',
                      full: true,
                      onPressed: () => showUploadPhotoSheet(context),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RLBtn(
                      label: 'Remove',
                      kind: RLBtnKind.light,
                      full: true,
                      onPressed: () =>
                          showRemovePhotoSheet(context, initials: initials),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const RLLabel('Basic information'),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              AccountField(
                label: 'Full name',
                value: name,
                action: 'Change',
                onAction: () => showChangeNameSheet(context, name: name),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Divider(height: 1, color: RLTokens.hairlineSoft),
              ),
              AccountField(
                label: 'Email address',
                value: email,
                action: 'Change',
                badge: kPlaceholderEmailVerified
                    ? const RLPill('Verified', tone: RLTone.success)
                    : const RLPill('Unverified', tone: RLTone.warning),
                onAction: () => showAccountComingSoon(ref, 'Email updates'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
