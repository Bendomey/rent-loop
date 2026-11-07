import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/checklist_sheet.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

import '../../../support/home_fakes.dart';

Future<void> _pump(
  WidgetTester tester,
  Future<Map<String, String>> Function() roles,
) async {
  tester.view.physicalSize = const Size(1200, 3000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        myPropertyRolesProvider.overrideWith((ref) => roles()),
        ...HomeFakes(
          payments: (_, __) => Completer<Never>().future,
          charges: (_, __) => Completer<Never>().future,
          leases: (_, __) => Completer<Never>().future,
          repairs: (_, __) => Completer<Never>().future,
          units: (_, __) => Completer<Never>().future,
          pending: (_, __) => Completer<Never>().future,
          names: (_) => Completer<Never>().future,
        ).overrides(ids: const [null]),
      ],
      child: const MaterialApp(home: HomeScreen()),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  testWidgets('Home shows the v1 quick actions only', (tester) async {
    await _pump(tester, () async => {'p1': 'MANAGER'});

    for (final t in ['Add tenant', 'Record payment', 'Repairs', 'Announce']) {
      expect(find.text(t), findsOneWidget, reason: t);
    }
    expect(find.text('New booking'), findsNothing);
    expect(find.text('Add property'), findsNothing);
    expect(find.byIcon(Icons.notifications_outlined), findsNothing);
    expect(find.byType(ChecklistBanner), findsNothing);
  });

  testWidgets('staff do not get the Record payment shortcut', (tester) async {
    await _pump(tester, () async => {'p1': 'STAFF'});

    expect(find.text('Record payment'), findsNothing);
    expect(find.text('Repairs'), findsOneWidget);
  });

  testWidgets('the shortcut stays hidden while roles are loading', (
    tester,
  ) async {
    await _pump(tester, () => Completer<Map<String, String>>().future);

    expect(find.text('Record payment'), findsNothing);
  });

  testWidgets('Announcement shortcut is hidden for STAFF-only users', (
    tester,
  ) async {
    await _pump(tester, () async => {'p1': 'STAFF'});

    expect(find.text('Announce'), findsNothing);
  });

  testWidgets('Announcement shortcut stays hidden while roles load', (
    tester,
  ) async {
    await _pump(tester, () => Completer<Map<String, String>>().future);

    expect(find.text('Announce'), findsNothing);
  });
}
