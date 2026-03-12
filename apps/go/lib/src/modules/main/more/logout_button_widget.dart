import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class LogoutButtonWidget extends ConsumerWidget {
  const LogoutButtonWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> logout() async {
      await Haptics.vibrate(HapticsType.medium);
      await ref.read(appStartupNotifierProvider.notifier).logout();
      // GoRouter redirect guard navigates to /auth when status becomes
      // unauthenticated — no context.go() needed here.
      if (context.mounted) {
        await Haptics.vibrate(HapticsType.success);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You logged out successfully!')),
        );
      }
    }

    Future<void> showMyDialog() async {
      await Haptics.vibrate(HapticsType.selection);
      return showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text('Confirm'),
            backgroundColor: Colors.white,
            content: const Text('Are you sure you want to log out?'),
            actions: <Widget>[
              TextButton(
                child: const Text('No'),
                onPressed: () async {
                  await Haptics.vibrate(HapticsType.light);
                  Navigator.of(context).pop();
                },
              ),
              FilledButton(onPressed: logout, child: const Text('Yes')),
            ],
          );
        },
      );
    }

    return IconButton(
      onPressed: showMyDialog,
      icon: const Icon(Icons.logout, color: Colors.black87),
    );
  }
}
