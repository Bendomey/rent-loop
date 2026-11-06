import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/lib/financial/schedule.dart';
import 'package:rentloop_manager/src/lib/money.dart';

import 'harness.dart';

void main() {
  setUp(() => FakeStartBilling.calls.clear());

  testWidgets('save stays off until there is a rent', (tester) async {
    await pumpFinancialPage(tester, application());

    await tapSave(tester);
    expect(FakeStartBilling.calls, isEmpty);
  });

  testWidgets('typed rent and a tapped fee reach the notifier', (tester) async {
    await pumpFinancialPage(tester, application());

    await tester.enterText(find.byKey(const ValueKey('rent-input')), '1500');
    await tester.pump();
    await tester.tap(find.text('Agency fee'));
    await tester.pump();
    await tapSave(tester);

    final call = FakeStartBilling.calls.single;
    expect(call['rentMinor'], 150000);
    expect(call['fees'], [
      (name: 'Agency fee', category: 'AGENCY_FEE', amount: 50000),
    ]);
    expect(call['choice'], BillingChoice.monthly);
    expect(call['leadDays'], 5);
    expect(call['currency'], 'GHS');
    expect(call['existingAccountId'], isNull);
  });

  testWidgets('a chip tapped before any rent uses the 1000 base', (
    tester,
  ) async {
    await pumpFinancialPage(tester, application());

    await tester.tap(find.text('Security deposit'));
    await tester.pump();

    expect(find.widgetWithText(TextField, '1000'), findsOneWidget);
  });

  testWidgets('the advertised rent chip fills the input', (tester) async {
    await pumpFinancialPage(tester, application());

    await tester.tap(find.textContaining('Unit 1 is advertised at'));
    await tester.pump();

    expect(find.widgetWithText(TextField, '2000'), findsOneWidget);
  });

  testWidgets('a saved rent prefills the input', (tester) async {
    await pumpFinancialPage(tester, application(rentFee: 180000));

    expect(find.widgetWithText(TextField, '1800'), findsOneWidget);
  });

  testWidgets('the whole-term total matches the schedule', (tester) async {
    await pumpFinancialPage(tester, application());

    await tester.enterText(find.byKey(const ValueKey('rent-input')), '1500');
    await tester.pump();
    await tester.tap(find.text('Agency fee'));
    await tester.pump();

    final periods = buildSchedule(
      rent: 150000,
      moveIn: DateTime.utc(2026, 9, 1),
      stayDuration: 12,
      stayFrequency: PaymentFrequency.monthly,
      paymentFrequency: PaymentFrequency.monthly,
    );
    final total = 150000 * periods.length + 50000;
    expect(find.text(formatPesewas(total)), findsWidgets);
    expect(find.text(formatPesewas(150000 + 50000)), findsWidgets);
    expect(find.text('Most landlords pick this'), findsOneWidget);
  });

  const pastHint =
      'Move-in has passed. If they’ve already paid, pick “I\'ll bill manually” '
      'and record what they paid first.';

  testWidgets('a move-in in the past says to bill manually if they paid', (
    tester,
  ) async {
    await pumpFinancialPage(
      tester,
      application(extra: {'desired_move_in_date': '2020-01-01T00:00:00Z'}),
    );

    expect(find.text(pastHint), findsOneWidget);
  });

  testWidgets('a move-in still ahead has no such hint', (tester) async {
    await pumpFinancialPage(
      tester,
      application(extra: {'desired_move_in_date': '2099-01-01T00:00:00Z'}),
    );

    expect(find.text(pastHint), findsNothing);
  });

  testWidgets('an unnamed or empty fee keeps save off until it is filled', (
    tester,
  ) async {
    await pumpFinancialPage(tester, application(rentFee: 150000));

    await tester.tap(find.text('Something else'));
    await tester.pump();
    expect(find.text('Give every fee a name and an amount.'), findsOneWidget);
    await tapSave(tester);
    expect(FakeStartBilling.calls, isEmpty);

    await tester.enterText(
      find.widgetWithText(TextField, 'What is it for?'),
      'Water',
    );
    await tester.pump();
    expect(find.text('Give every fee a name and an amount.'), findsOneWidget);

    await tester.enterText(find.widgetWithText(TextField, '0.00').last, '50');
    await tester.pump();
    expect(find.text('Give every fee a name and an amount.'), findsNothing);

    await tapSave(tester);
    expect(FakeStartBilling.calls.single['fees'], [
      (name: 'Water', category: 'OTHER', amount: 5000),
    ]);
  });
}
