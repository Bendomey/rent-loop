import 'package:flutter/material.dart';

import '../../shared/widgets/empty_state.dart';

class ActivityScreen extends StatelessWidget {
  const ActivityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: EmptyState(
          icon: Icons.bar_chart_rounded,
          title: 'Activity',
          subtitle: 'Recent requests, applications, and lease changes.',
        ),
      ),
    );
  }
}
