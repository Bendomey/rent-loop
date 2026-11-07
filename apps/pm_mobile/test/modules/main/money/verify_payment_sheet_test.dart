import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/modules/main/money/verify_payment_sheet.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/verify_payment_notifier.dart';

import 'bill_fixtures.dart';

class _FakeVerify extends VerifyPaymentNotifier {
  static final calls = <Map<String, Object?>>[];
  static bool slow = false;

  @override
  Future<void> submit({
    required String propertyId,
    required String invoiceId,
    required String paymentId,
    required bool received,
    String? reason,
    String? financialAccountId,
  }) async {
    if (slow) await Future<void>.delayed(const Duration(seconds: 1));
    calls.add({'paymentId': paymentId, 'received': received, 'reason': reason});
    state = VerifyPaymentState(status: ApiStatus.success);
  }
}

Future<void> _pump(WidgetTester tester) async {
  mockHaptics();
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [verifyPaymentNotifierProvider.overrideWith(_FakeVerify.new)],
      child: MaterialApp(
        home: Scaffold(
          body: VerifyPaymentSheet(
            bill: billFixture(),
            payment: pendingPayment(),
            propertyId: 'p1',
            onClose: () {},
          ),
        ),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  setUp(() {
    _FakeVerify.calls.clear();
    _FakeVerify.slow = false;
  });

  testWidgets('shows what was reported', (tester) async {
    await _pump(tester);
    expect(find.text('Did you receive this payment?'), findsOneWidget);
    expect(find.text('GH₵ 300.00'), findsOneWidget);
    expect(find.text('MTN MoMo'), findsOneWidget);
    expect(find.text('MM-77'), findsOneWidget);
  });

  testWidgets('Payment received sends true', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Payment received'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 5));
    expect(_FakeVerify.calls, [
      {'paymentId': 'pay1', 'received': true, 'reason': null},
    ]);
  });

  testWidgets('Not received sends false with the reason', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Not received'));
    await tester.pump();
    await tester.enterText(find.byType(TextField), 'Nothing in my account');
    await tester.tap(find.text('Confirm not received'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 5));
    expect(_FakeVerify.calls, [
      {
        'paymentId': 'pay1',
        'received': false,
        'reason': 'Nothing in my account',
      },
    ]);
  });

  testWidgets('a blank reason is sent as null', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Not received'));
    await tester.pump();
    await tester.tap(find.text('Confirm not received'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 5));
    expect(_FakeVerify.calls.single['reason'], isNull);
  });

  testWidgets('a double tap submits once', (tester) async {
    _FakeVerify.slow = true;
    await _pump(tester);
    await tester.tap(find.text('Payment received'));
    await tester.tap(find.text('Payment received'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 6));
    expect(_FakeVerify.calls, hasLength(1));
  });
}
