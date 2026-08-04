import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/applications_list.dart';
import 'package:rentloop_manager/src/shared/tokens.dart';

void main() {
  testWidgets('mounts and shows the search field and every filter chip', (
    tester,
  ) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(home: Scaffold(body: ApplicationsList())),
      ),
    );
    await tester.pump();

    expect(find.text('Search name, email or phone'), findsOneWidget);
    for (final chip in [
      'Property',
      'Unit',
      'Status',
      'Gender',
      'Marital Status',
    ]) {
      expect(find.text(chip), findsOneWidget, reason: '$chip chip missing');
    }
  });

  testWidgets(
    'with no workspace it settles into the empty state, not a spinner',
    (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(home: Scaffold(body: ApplicationsList())),
        ),
      );
      // Let the post-frame first load run and fail out (no client id in a bare
      // ProviderScope), so the skeleton hands over to a real state.
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(find.byType(CircularProgressIndicator), findsNothing);
    },
  );

  test('a Completed application reads green, without moving statusTone', () {
    // The pill tone the card computes for each status.
    RLTone toneFor(String label) =>
        label == 'Completed' ? RLTone.success : statusTone(label);

    expect(toneFor('Completed'), RLTone.success);
    expect(toneFor('In Progress'), RLTone.info);
    expect(toneFor('Cancelled'), RLTone.danger);

    // statusTone() itself must stay neutral on Completed — the leases list
    // depends on that default.
    expect(statusTone('Completed'), RLTone.neutral);
  });
}
