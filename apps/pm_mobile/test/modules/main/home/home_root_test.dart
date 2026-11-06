import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/checklist_sheet.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';

void main() {
  testWidgets('Home shows the v1 quick actions only', (tester) async {
    tester.view.physicalSize = const Size(1200, 3000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: HomeScreen())),
    );
    await tester.pump();

    for (final t in [
      'Add tenant',
      'Record payment',
      'Repairs',
      'Announcement',
    ]) {
      expect(find.text(t), findsOneWidget, reason: t);
    }
    expect(find.text('New booking'), findsNothing);
    expect(find.text('Add property'), findsNothing);
    expect(find.byIcon(Icons.notifications_outlined), findsNothing);
    expect(find.byType(ChecklistBanner), findsNothing);
  });
}
