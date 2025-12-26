import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _HomeScreen();
}

class _HomeScreen extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Overview',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
      ),
      body: Text('Home Screen'),
    );
  }
}
