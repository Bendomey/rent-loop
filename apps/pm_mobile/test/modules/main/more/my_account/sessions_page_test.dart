import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/root.dart';
import 'package:rentloop_manager/src/repository/models/session_model.dart';
import 'package:rentloop_manager/src/repository/providers/sessions_provider.dart';

SessionModel _session({required String id, required bool isCurrent}) =>
    SessionModel(
      id: id,
      isCurrent: isCurrent,
      signedInAt: '2026-07-30T09:00:00Z',
      lastUsedAt: '2026-07-31T09:00:00Z',
      expiresAt: '2026-08-30T09:00:00Z',
      deviceName: 'iPhone 16 Pro Max',
      deviceKind: 'PHONE',
      ipAddress: '41.66.0.1',
    );

Widget _app(List<SessionModel> sessions) => ProviderScope(
  overrides: [
    sessionsProvider.overrideWith((ref) async => sessions),
  ],
  child: const MaterialApp(home: MyAccountScreen()),
);

void main() {
  // The Sessions page brings its own ListView so pull-to-refresh works. The
  // account shell used to wrap every sub-page in a SingleChildScrollView,
  // which left that ListView with unbounded height and failed layout the
  // moment the page opened.
  testWidgets('Sessions page opens without a layout exception', (tester) async {
    await tester.pumpWidget(
      _app([
        _session(id: 'a', isCurrent: true),
        _session(id: 'b', isCurrent: false),
      ]),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sessions'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('2 active sessions'), findsOneWidget);
    expect(find.text('Sign out all others (1)'), findsOneWidget);
  });

  testWidgets('Sessions page lays out while still loading', (tester) async {
    // The skeleton is a ListView too, so it hit the same unbounded-height
    // failure before the page ever had data.
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sessionsProvider.overrideWith(
            (ref) => Future<List<SessionModel>>.delayed(
              const Duration(seconds: 1),
              () => const [],
            ),
          ),
        ],
        child: const MaterialApp(home: MyAccountScreen()),
      ),
    );
    await tester.pump();

    await tester.tap(find.text('Sessions'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(tester.takeException(), isNull);

    await tester.pumpAndSettle(const Duration(seconds: 2));
  });
}
