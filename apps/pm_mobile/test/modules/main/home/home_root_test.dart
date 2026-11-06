import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/modules/main/checklist_sheet.dart';
import 'package:rentloop_manager/src/modules/main/home/root.dart';
import 'package:rentloop_manager/src/repository/models/activity_counts_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

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
        homeStatsProvider.overrideWith((ref) => Completer<HomeStats>().future),
        activityCountsProvider.overrideWith(
          (ref) => Completer<ActivityCounts>().future,
        ),
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

    expect(find.text('Announcement'), findsNothing);
  });

  testWidgets('Announcement shortcut stays hidden while roles load', (
    tester,
  ) async {
    await _pump(tester, () => Completer<Map<String, String>>().future);

    expect(find.text('Announcement'), findsNothing);
  });
}
