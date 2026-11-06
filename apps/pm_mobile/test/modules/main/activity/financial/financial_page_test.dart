import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/start_billing_notifier.dart';

import 'harness.dart';

void main() {
  setUp(() {
    FakeStartBilling.calls.clear();
    FakeStartBilling.result = StartBillingState(
      status: ApiStatus.success,
      accountId: 'fa',
    );
  });

  testWidgets('blocked asks for the move-in date first', (tester) async {
    await pumpFinancialPage(tester, application(moveInSet: false));

    expect(find.text('Set the move-in date first'), findsOneWidget);
    expect(find.text('Set the move-in date'), findsOneWidget);
    expect(find.text('Save this and start billing'), findsNothing);
  });

  testWidgets('a STAFF user in setup cannot start billing', (tester) async {
    await pumpFinancialPage(
      tester,
      application(),
      roles: const {'p1': 'STAFF'},
    );

    expect(find.text("Billing hasn't been set up yet."), findsOneWidget);
    expect(find.text('Save this and start billing'), findsNothing);
  });

  testWidgets('fees that could not be added are called out', (tester) async {
    FakeStartBilling.result = StartBillingState(
      status: ApiStatus.success,
      accountId: 'fa',
      failedFees: ['Agency fee', 'VAT'],
    );
    await pumpFinancialPage(tester, application(rentFee: 150000));

    await tapSave(tester);

    expect(
      find.text(
        'Rent is set up, but these fees could not be added: Agency fee, VAT',
      ),
      findsOneWidget,
    );
  });

  testWidgets('a billing plan that failed to save is called out', (
    tester,
  ) async {
    FakeStartBilling.result = StartBillingState(
      status: ApiStatus.success,
      accountId: 'fa',
      policyFailed: true,
    );
    await pumpFinancialPage(tester, application(rentFee: 150000));

    await tapSave(tester);

    expect(
      find.text("Couldn't save the billing plan — change it below."),
      findsOneWidget,
    );
  });
}
