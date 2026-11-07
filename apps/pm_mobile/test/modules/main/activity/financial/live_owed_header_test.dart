import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/live_owed_header.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

import 'harness.dart';

FinancialAccountDetailModel _detail({required int outstanding}) =>
    FinancialAccountDetailModel(
      account: FinancialAccountModel(
        id: 'fa',
        currency: 'GHS',
        rentBillingCadence: 'MANUAL',
        rentBillingInterval: 0,
        autoIssueDaysBefore: 5,
        status: 'ACTIVE',
      ),
      charges: const [],
      totalCharged: 100000,
      totalSettled: 150000,
      outstandingAmount: outstanding,
      availableCredit: 0,
    );

Future<void> _pump(WidgetTester tester, int outstanding) => tester.pumpWidget(
  MaterialApp(
    home: Scaffold(
      body: LiveOwedHeader(
        application: application(),
        detail: _detail(outstanding: outstanding),
        canEdit: false,
      ),
    ),
  ),
);

void main() {
  testWidgets('a credit reads as what you owe them, without a minus', (
    tester,
  ) async {
    await _pump(tester, -50000);

    expect(find.text('You owe Ama'), findsOneWidget);
    expect(find.text('Ama still owes you'), findsNothing);
    expect(find.text('500.00'), findsOneWidget);
    expect(find.textContaining('-'), findsNothing);
    expect(find.text('Paid GH₵ 1,500.00'), findsOneWidget);
  });

  testWidgets('nothing owed reads as all paid up', (tester) async {
    await _pump(tester, 0);

    expect(find.text('Ama is all paid up'), findsOneWidget);
    expect(find.text('Ama still owes you'), findsNothing);
  });

  testWidgets('a balance still reads as owed', (tester) async {
    await _pump(tester, 50000);

    expect(find.text('Ama still owes you'), findsOneWidget);
    expect(find.text('500.00'), findsOneWidget);
  });
}
