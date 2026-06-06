import 'package:flutter/material.dart';

class StubScreen extends StatelessWidget {
  const StubScreen({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(label)),
      body: Center(
        child: Text(
          '$label — coming up next',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }
}
