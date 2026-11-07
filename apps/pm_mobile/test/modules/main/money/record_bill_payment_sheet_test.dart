import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/modules/main/money/record_bill_payment_sheet.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/record_bill_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/payment_accounts_provider.dart';

import 'bill_fixtures.dart';

class _FakeRecord extends RecordBillPaymentNotifier {
  static final calls = <Map<String, Object?>>[];
  static ApiStatus result = ApiStatus.success;
  static bool slow = false;

  @override
  Future<void> submit({
    required String propertyId,
    required String invoiceId,
    required int amount,
    required String paymentAccountId,
    required String provider,
    String? reference,
    String? financialAccountId,
  }) async {
    calls.add({
      'amount': amount,
      'account': paymentAccountId,
      'provider': provider,
      'reference': reference,
    });
    if (slow) await Future<void>.delayed(const Duration(seconds: 1));
    state = RecordBillPaymentState(
      status: result,
      errorMessage: result == ApiStatus.failed ? 'Nope.' : null,
    );
  }
}

Future<void> _pump(
  WidgetTester tester, {
  List<PaymentAccountModel>? accounts,
}) async {
  mockHaptics();
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        recordBillPaymentNotifierProvider.overrideWith(_FakeRecord.new),
        paymentAccountsProvider.overrideWith(
          (ref) async =>
              accounts ??
              [
                PaymentAccountModel(
                  id: 'pa1',
                  rail: 'OFFLINE',
                  identifier: 'Cash box',
                  isDefault: true,
                ),
              ],
        ),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: RecordBillPaymentSheet(
            bill: billFixture(),
            propertyId: 'p1',
            onClose: () {},
          ),
        ),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  setUp(() {
    _FakeRecord.calls.clear();
    _FakeRecord.result = ApiStatus.success;
    _FakeRecord.slow = false;
  });

  testWidgets('more than the remaining balance warns and blocks Save', (
    tester,
  ) async {
    await _pump(tester);
    await tester.enterText(find.byType(TextField).first, '3000.01');
    await tester.pump();
    expect(
      find.text('That is more than the bill has left on it.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(_FakeRecord.calls, isEmpty);
  });

  testWidgets('They paid it all fills the remaining amount', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('They paid it all · GH₵ 3,000.00'));
    await tester.pump();
    expect(find.widgetWithText(TextField, '3000'), findsOneWidget);
  });

  testWidgets('Save sends pesewas, provider, account and reference', (
    tester,
  ) async {
    await _pump(tester);
    await tester.enterText(find.byType(TextField).first, '120.50');
    await tester.tap(find.text('MTN MoMo'));
    await tester.enterText(find.byType(TextField).last, 'RC-9');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 5));
    expect(_FakeRecord.calls, [
      {
        'amount': 12050,
        'account': 'pa1',
        'provider': 'MTN',
        'reference': 'RC-9',
      },
    ]);
  });

  testWidgets('Save stays off with no amount', (tester) async {
    await _pump(tester);
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(_FakeRecord.calls, isEmpty);
  });

  testWidgets('no payment accounts blocks Save', (tester) async {
    await _pump(tester, accounts: []);
    expect(
      find.text('Add a payment account on the web first.'),
      findsOneWidget,
    );
    await tester.enterText(find.byType(TextField).first, '10');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(_FakeRecord.calls, isEmpty);
  });

  testWidgets('a failure shows inline', (tester) async {
    _FakeRecord.result = ApiStatus.failed;
    await _pump(tester);
    await tester.enterText(find.byType(TextField).first, '10');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pump();
    expect(find.text('Nope.'), findsOneWidget);
  });

  for (final bad in ['1e2', 'Infinity', 'NaN', '-5']) {
    testWidgets('$bad is not an amount', (tester) async {
      await _pump(tester);
      await tester.enterText(find.byType(TextField).first, bad);
      await tester.pump();
      expect(find.text('Enter an amount like 120.50.'), findsOneWidget);
      await tester.tap(find.text('Save'));
      await tester.pump();
      expect(_FakeRecord.calls, isEmpty);
    });
  }

  testWidgets('a double tap submits once', (tester) async {
    _FakeRecord.slow = true;
    await _pump(tester);
    await tester.enterText(find.byType(TextField).first, '10');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.tap(find.text('Save'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 6));
    expect(_FakeRecord.calls, hasLength(1));
  });
}
