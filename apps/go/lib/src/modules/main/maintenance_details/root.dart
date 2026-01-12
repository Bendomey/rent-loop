import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:flutter/material.dart';

class MaintenanceDetailsScreen extends ConsumerStatefulWidget {
  const MaintenanceDetailsScreen({super.key, required this.requestId});

  final String requestId;

  @override
  ConsumerState<ConsumerStatefulWidget> createState() =>
      _MaintenanceDetailsScreen();
}

class _MaintenanceDetailsScreen
    extends ConsumerState<MaintenanceDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Maintenance Details',
          style: Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 20),
        ),
      ),

      // body with view
      body: Container(
        padding: EdgeInsets.symmetric(horizontal: 10),
        child: Column(children: [Text("jdjfjds")]),
      ),
    );
  }
}
