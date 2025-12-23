import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _PaymentsScreen();
}

class _PaymentsScreen extends ConsumerState<PaymentsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Payments')),
      body: Text('Payments Screen'),
    );
  }
}
