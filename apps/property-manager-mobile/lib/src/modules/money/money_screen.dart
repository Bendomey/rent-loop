import 'package:flutter/material.dart';

import '../../shared/widgets/empty_state.dart';

class MoneyScreen extends StatelessWidget {
  const MoneyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: EmptyState(
          icon: Icons.account_balance_wallet_rounded,
          title: 'Money',
          subtitle: 'Invoices, payments, and revenue at a glance.',
        ),
      ),
    );
  }
}
