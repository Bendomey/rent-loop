import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    // The real bottom nav lands in the Home commit. For now this just shows
    // the currently selected branch so the router compiles and we can wire
    // the SignInScreen up first.
    return Scaffold(
      body: navigationShell,
      floatingActionButton: FloatingActionButton.small(
        onPressed: () {
          // Useful while stubs are in place — let the developer jump between
          // branches without writing a real tab bar yet.
          final next = (navigationShell.currentIndex + 1) % 5;
          navigationShell.goBranch(next);
        },
        child: const Icon(Icons.swap_horiz),
      ),
    );
  }
}
