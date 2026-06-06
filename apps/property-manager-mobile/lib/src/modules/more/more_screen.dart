import 'package:flutter/material.dart';

import '../../shared/widgets/empty_state.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: EmptyState(
          icon: Icons.more_horiz_rounded,
          title: 'More',
          subtitle: 'Settings, profile, and other workspace tools.',
        ),
      ),
    );
  }
}
