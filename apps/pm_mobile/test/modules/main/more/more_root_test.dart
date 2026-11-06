import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/more/root.dart';

void main() {
  testWidgets('More shows only the v1 rows', (tester) async {
    tester.view.physicalSize = const Size(800, 3000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: MoreScreen())),
    );
    await tester.pump();

    for (final t in ['Repairs', 'Announcements', 'Leases', 'Help & support']) {
      expect(find.text(t), findsOneWidget, reason: t);
    }
    for (final t in [
      'Tenants',
      'Documents & e-sign',
      'Reports',
      'General settings',
      'Members & roles',
      'Payment accounts',
      'Billing',
      'Archived properties',
      'Share Rentloop',
      'Organisation settings',
    ]) {
      expect(find.text(t), findsNothing, reason: t);
    }
  });
}
