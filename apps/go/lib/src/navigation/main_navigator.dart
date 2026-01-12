import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class MainNavigator extends StatelessWidget {
  const MainNavigator(this.navigationShell, {super.key});

  /// The navigation shell and container for the branch Navigators.
  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          NavigationDestination(
            icon: Icon(Icons.pie_chart_outline),
            label: 'Home',
            selectedIcon: Icon(Icons.pie_chart_rounded, color: Colors.white),
          ),
          NavigationDestination(
            icon: Icon(Icons.payments_outlined),
            label: 'Payments',
            selectedIcon: Icon(Icons.payments, color: Colors.white),
          ),
          NavigationDestination(
            icon: Badge.count(count: 10, child: Icon(Icons.build_outlined)),
            label: 'Maintenance',
            selectedIcon: Badge.count(
              count: 10,
              backgroundColor: Colors.white,
              textColor: Colors.red,
              child: Icon(Icons.build, color: Colors.white),
            ),
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz_outlined),
            label: 'More',
            selectedIcon: Icon(Icons.more_horiz, color: Colors.white),
          ),
        ],
        onDestinationSelected: _onTap,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: const Color.fromARGB(255, 230, 2, 63),
      ),
    );
  }

  void _onTap(index) {
    Haptics.vibrate(HapticsType.selection);
    navigationShell.goBranch(
      index,
      // A common pattern when using bottom navigation bars is to support
      // navigating to the initial location when tapping the item that is
      // already active. This example demonstrates how to support this behavior,
      // using the initialLocation parameter of goBranch.
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}
