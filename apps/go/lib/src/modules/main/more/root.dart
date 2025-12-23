import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class MoreScreen extends ConsumerStatefulWidget {
  const MoreScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _MoreScreen();
}

class _MoreScreen extends ConsumerState<MoreScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('More')),
      body: Text('More Screen'),
    );
  }
}
