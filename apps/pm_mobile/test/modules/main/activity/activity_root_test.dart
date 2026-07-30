import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/root.dart';
import 'package:rentloop_manager/src/repository/models/activity_counts_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

Widget _harness(Override override) => ProviderScope(
  overrides: [override],
  child: const MaterialApp(home: ActivityScreen()),
);

/// Badge assertions must be scoped to the segmented control: the maintenance
/// board rendered below it has its own per-column count headers, which show
/// "0" for columns that have not fetched yet and would otherwise match.
Finder _badge(String text) =>
    find.descendant(of: find.byType(RLSegmented), matching: find.text(text));

void main() {
  group('Activity segment badges', () {
    testWidgets('render the counts resolved from Cube', (tester) async {
      await tester.pumpWidget(
        _harness(
          activityCountsProvider.overrideWith(
            (ref) async => const ActivityCounts(
              maintenance: 12,
              applications: 3,
              bookings: 5,
            ),
          ),
        ),
      );
      // Two pumps: one to mount, one to settle the resolved future.
      await tester.pump();
      await tester.pump();

      expect(_badge('12'), findsOneWidget);
      expect(_badge('3'), findsOneWidget);
      expect(_badge('5'), findsOneWidget);
    });

    testWidgets('show no badge at all while the counts are loading', (
      tester,
    ) async {
      await tester.pumpWidget(
        // A Completer that is never completed, rather than a delayed future —
        // the latter leaves a pending timer at teardown, which the test
        // binding fails on.
        _harness(
          activityCountsProvider.overrideWith(
            (ref) => Completer<ActivityCounts>().future,
          ),
        ),
      );
      await tester.pump();

      // The three labels are present, but neither the old hardcoded numbers
      // nor a placeholder zero may stand in for the pending counts.
      expect(_badge('Maintenance'), findsOneWidget);
      expect(_badge('Applications'), findsOneWidget);
      expect(_badge('Bookings'), findsOneWidget);
      for (final stale in ['9', '4', '0', '12']) {
        expect(_badge(stale), findsNothing, reason: 'badge "$stale" leaked');
      }
    });

    testWidgets('show no badge when the Cube query fails', (tester) async {
      await tester.pumpWidget(
        _harness(
          activityCountsProvider.overrideWith(
            (ref) async => throw Exception('cube down'),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();

      // A zero would read as "nothing to do here" — worse than no badge.
      expect(_badge('Maintenance'), findsOneWidget);
      expect(_badge('0'), findsNothing);
    });
  });
}
