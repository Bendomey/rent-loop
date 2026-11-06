import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rentloop_manager/src/architecture/current_user/current_user_notifier.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/widgets.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

/// Read-only in v1: there is no API to change the name, email or photo yet.
class AccountProfilePage extends ConsumerWidget {
  const AccountProfilePage({super.key, required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserNotifierProvider);
    final phone = user?.phoneNumber;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Center(
          child: Container(
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
        ),
        const RLLabel('Basic information'),
        RLCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              AccountField(label: 'Full name', value: user?.name ?? '—'),
              const _FieldDivider(),
              AccountField(
                label: 'Phone number',
                value: phone == null || phone.isEmpty ? '—' : phone,
              ),
              const _FieldDivider(),
              AccountField(label: 'Email address', value: user?.email ?? '—'),
            ],
          ),
        ),
      ],
    );
  }
}

class _FieldDivider extends StatelessWidget {
  const _FieldDivider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 16),
      child: Divider(height: 1, color: RLTokens.hairlineSoft),
    );
  }
}
