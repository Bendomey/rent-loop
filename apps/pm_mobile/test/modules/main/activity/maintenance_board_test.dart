import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/maintenance_board.dart';

void main() {
  testWidgets('mounts without throwing and shows the New page', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: Scaffold(body: MaintenanceBoard())),
      ),
    );
    await tester.pump();

    expect(find.text('New'), findsWidgets);
  });
}
