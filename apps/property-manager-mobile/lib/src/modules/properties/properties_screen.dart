import 'package:flutter/material.dart';

import '../../shared/widgets/empty_state.dart';

class PropertiesScreen extends StatelessWidget {
  const PropertiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: EmptyState(
          icon: Icons.apartment_rounded,
          title: 'Properties',
          subtitle: 'Manage your buildings, units, and occupancy.',
        ),
      ),
    );
  }
}
