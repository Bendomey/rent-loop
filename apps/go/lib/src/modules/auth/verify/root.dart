import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class VerifyScreen extends ConsumerStatefulWidget {
  final String phone;

  const VerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _VerifyScreen();
}

class _VerifyScreen extends ConsumerState<VerifyScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Verify')),
      body: Text('Verify Screen'),
    );
  }
}
