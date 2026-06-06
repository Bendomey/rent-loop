import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/shared/toast.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

class MainShell extends ConsumerWidget {
  const MainShell(this.shell, {super.key});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final toast = ref.watch(rlToastProvider);
    return Scaffold(
      body: Stack(
        children: [
          shell,
          if (toast != null)
            Positioned(
              left: 14,
              right: 14,
              bottom: 10,
              child: RLToastWidget(
                toast: toast,
                onDismiss: () => ref.read(rlToastProvider.notifier).dismiss(),
              ),
            ),
        ],
      ),
      bottomNavigationBar: _TabBar(
        currentIndex: shell.currentIndex,
        onTap: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.currentIndex, required this.onTap});
  final int currentIndex;
  final ValueChanged<int> onTap;

  static const _tabs = [
    _Tab(label: 'Home', icon: Icons.home_rounded, activeIcon: Icons.home_rounded),
    _Tab(label: 'Properties', icon: Icons.apartment_outlined, activeIcon: Icons.apartment_rounded),
    _Tab(label: 'Activity', icon: Icons.bolt_outlined, activeIcon: Icons.bolt_rounded),
    _Tab(label: 'Money', icon: Icons.account_balance_wallet_outlined, activeIcon: Icons.account_balance_wallet_rounded),
    _Tab(label: 'More', icon: Icons.grid_view_outlined, activeIcon: Icons.grid_view_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: RLTokens.surface,
        border: Border(top: BorderSide(color: RLTokens.hairline)),
        boxShadow: RLTokens.elevBar,
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 58,
          child: Row(
            children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  child: _TabItem(
                    tab: _tabs[i],
                    active: i == currentIndex,
                    onTap: () => onTap(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Tab {
  const _Tab({required this.label, required this.icon, required this.activeIcon});
  final String label;
  final IconData icon;
  final IconData activeIcon;
}

class _TabItem extends StatelessWidget {
  const _TabItem({required this.tab, required this.active, required this.onTap});
  final _Tab tab;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? RLTokens.crimson : RLTokens.mutedSoft;
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(active ? tab.activeIcon : tab.icon, color: color, size: 22),
          const SizedBox(height: 3),
          Text(
            tab.label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: active ? RLTokens.semibold : RLTokens.regular,
              color: color,
              letterSpacing: active ? 0.1 : 0,
            ),
          ),
        ],
      ),
    );
  }
}
