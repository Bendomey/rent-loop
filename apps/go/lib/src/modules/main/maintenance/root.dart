import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class MaintenanceScreen extends ConsumerStatefulWidget {
  const MaintenanceScreen({super.key});

  @override
  ConsumerState<ConsumerStatefulWidget> createState() => _MaintenanceScreen();
}

class _MaintenanceScreen extends ConsumerState<MaintenanceScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Maintenance')),
      body: Text('Maintenance Screen'),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Action for the button
        },
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
