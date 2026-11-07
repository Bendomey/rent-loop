import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/session_api.dart';
import 'package:rentloop_manager/src/modules/main/more/my_account/sessions_page.dart';
import 'package:rentloop_manager/src/repository/models/session_model.dart';
import 'package:rentloop_manager/src/shared/toast.dart';

import '../../../../support/real_notifier_support.dart';

SessionModel _session(String id, {required bool current}) => SessionModel(
  id: id,
  isCurrent: current,
  signedInAt: '2026-07-30T09:00:00Z',
  lastUsedAt: '2026-07-31T09:00:00Z',
  expiresAt: '2026-08-30T09:00:00Z',
  deviceName: 'iPhone $id',
  deviceKind: 'PHONE',
  ipAddress: '41.66.0.1',
);

class _Api extends SessionApi {
  _Api({this.fail = false}) : super(tokenManager: fakeTokenManager());

  final bool fail;

  @override
  Future<List<SessionModel>> getSessions() async => [
    _session('a', current: true),
    _session('b', current: false),
    _session('c', current: false),
  ];

  @override
  Future<void> revokeSession(String sessionId) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (fail) throw ApiException(500, '{}');
  }

  @override
  Future<int> revokeOtherSessions() async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (fail) throw ApiException(500, '{}');
    return 2;
  }
}

Future<RecordingToast> _pump(WidgetTester tester, _Api api) async {
  final toast = RecordingToast();
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        sessionApiProvider.overrideWithValue(api),
        rlToastProvider.overrideWith(() => toast),
      ],
      child: const MaterialApp(home: Scaffold(body: AccountSessionsPage())),
    ),
  );
  await tester.pumpAndSettle();
  return toast;
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('sign out all others reports the count the server ended', (
    tester,
  ) async {
    final toast = await _pump(tester, _Api());

    await tester.tap(find.text('Sign out all others (2)'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign out all others').last);
    await pumpFrames(tester);

    expect(toast.shown.single.title, 'Signed out 2 other sessions');
  });

  testWidgets('a failed sign out of other sessions is reported, not hidden', (
    tester,
  ) async {
    final toast = await _pump(tester, _Api(fail: true));

    await tester.tap(find.text('Sign out all others (2)'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign out all others').last);
    await pumpFrames(tester);

    expect(toast.shown.single.tone, RLToastTone.error);
  });

  testWidgets('a failed single sign out is reported, not hidden', (
    tester,
  ) async {
    final toast = await _pump(tester, _Api(fail: true));

    await tester.tap(find.text('Sign out').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign out device'));
    await pumpFrames(tester);

    expect(toast.shown.single.tone, RLToastTone.error);
  });
}
