import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class LogoutButtonWidget extends ConsumerWidget {
  const LogoutButtonWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> logout() async {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/auth');
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('You logged out successfully!')),
        );
      });
    }

    Future<void> showMyDialog() async {
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
                onPressed: () {
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
      // child: const Text(
      //   'Logout',
      //   style: TextStyle(
      //     fontSize: 18,
      //     color: Colors.black87,
      //     // fontWeight: FontWeight.normal
      //   ),
      // ),
      icon: const Icon(Icons.logout, color: Colors.black87),
    );
  }
}
