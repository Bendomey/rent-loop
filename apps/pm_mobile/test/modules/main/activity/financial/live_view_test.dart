import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/billing_policy_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/void_charge_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/payment_accounts_provider.dart';

import 'harness.dart';

class FakeVoid extends VoidChargeNotifier {
  static final calls = <Map<String, String>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required String chargeId,
    required String reason,
  }) async {
    calls.add({'chargeId': chargeId, 'reason': reason});
    state = VoidChargeState(status: ApiStatus.success);
  }
}

class FakePolicy extends BillingPolicyNotifier {
  static final calls = <BillingChoice>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required BillingChoice choice,
    required int leadDays,
  }) async {
    calls.add(choice);
    state = BillingPolicyState(status: ApiStatus.success);
  }
}

class FakeUpdate extends UpdateApplicationNotifier {
  static final calls = <Map<String, dynamic>>[];
  static UpdateApplicationState result = UpdateApplicationState(
    status: ApiStatus.success,
  );

  @override
  Future<void> submit({
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
    String? accountId,
  }) async {
    calls.add(patch);
    state = result;
  }
}

Map<String, dynamic> _charge(
  String id,
  String name,
  String category,
  int amount,
  String due, {
  int invoiced = 0,
  int settled = 0,
  String? voidedAt,
  String? reason,
}) => {
  'id': id,
  'name': name,
  'category': category,
  'amount': amount,
  'currency': 'GHS',
  'due_date': due,
  'invoiced_amount': invoiced,
  'settled_amount': settled,
  'outstanding_amount': amount - settled,
  'status': 'OPEN',
  'voided_at': voidedAt,
  'voided_reason': reason,
};

FinancialAccountDetailModel account({
  bool billedRent = false,
  bool paidDeposit = false,
  String cadence = 'EVERY_PERIOD',
  List<Map<String, dynamic>> extra = const [],
  bool billedFee = true,
}) => FinancialAccountDetailModel.fromJson({
  'account': {
    'id': 'fa',
    'currency': 'GHS',
    'rent_billing_cadence': cadence,
    'rent_billing_interval': 0,
    'auto_issue_days_before': 5,
    'status': 'ACTIVE',
  },
  'charges': [
    for (var i = 0; i < 6; i++)
      _charge(
        'r$i',
        'Rent ${i + 1}',
        'RENT',
        200000,
        '2030-0${i + 1}-01T00:00:00Z',
        invoiced: billedRent && i == 0 ? 200000 : 0,
        settled: billedRent && i == 0 ? 200000 : 0,
      ),
    _charge(
      'dep',
      'Security deposit',
      'SECURITY_DEPOSIT',
      200000,
      '2030-01-01T00:00:00Z',
      settled: paidDeposit ? 200000 : 0,
    ),
    _charge(
      'inv',
      'Agency fee',
      'AGENCY_FEE',
      50000,
      '2030-01-01T00:00:00Z',
      invoiced: billedFee ? 50000 : 0,
    ),
    _charge(
      'gone',
      'Old fee',
      'OTHER',
      10000,
      '2030-01-01T00:00:00Z',
      voidedAt: '2029-12-01T00:00:00Z',
      reason: 'Duplicate',
    ),
    ...extra,
  ],
  'total_charged': 1450000,
  'total_settled': 0,
  'outstanding_amount': 1450000,
  'available_credit': 0,
});

final _overrides = [
  voidChargeNotifierProvider.overrideWith(FakeVoid.new),
  paymentAccountsProvider.overrideWith((ref) async => const []),
  billingPolicyNotifierProvider.overrideWith(FakePolicy.new),
  updateApplicationNotifierProvider.overrideWith(FakeUpdate.new),
];

Future<void> pumpLive(
  WidgetTester tester, {
  FinancialAccountDetailModel? detail,
  Map<String, String> roles = const {'p1': 'MANAGER'},
}) => pumpFinancialPage(
  tester,
  application(
    rentFee: 200000,
    extra: {
      'financial_account': {'id': 'fa'},
    },
  ),
  roles: roles,
  account: detail ?? account(),
  overrides: _overrides,
);

Future<void> tapText(WidgetTester tester, String text) async {
  final finder = find.text(text);
  await tester.ensureVisible(finder);
  await tester.pump();
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    FakeVoid.calls.clear();
    FakePolicy.calls.clear();
    FakeUpdate.calls.clear();
    FakeUpdate.result = UpdateApplicationState(status: ApiStatus.success);
  });

  testWidgets('header shows what is owed and that nothing is late', (
    tester,
  ) async {
    await pumpLive(tester);

    expect(find.text('Ama still owes you'), findsOneWidget);
    expect(find.text('14,500.00'), findsOneWidget);
    expect(find.text('Nothing is late'), findsOneWidget);
    expect(find.text('Ama paid me'), findsOneWidget);
    expect(find.text('Add a fee'), findsOneWidget);
  });

  testWidgets('rent is one row and the term total is shown', (tester) async {
    await pumpLive(tester);

    expect(find.text('6 payments · GH₵ 12,000.00'), findsOneWidget);
    expect(find.text('Over the whole term'), findsOneWidget);
    expect(find.text('GH₵ 14,500.00'), findsOneWidget);
    expect(find.text('Rent 2'), findsNothing);

    await tapText(tester, '6 payments · GH₵ 12,000.00');
    expect(find.text('Rent 2'), findsOneWidget);
  });

  testWidgets('only an unbilled fee can be removed', (tester) async {
    await pumpLive(tester);

    expect(find.byKey(const ValueKey('remove-dep')), findsOneWidget);
    expect(find.byKey(const ValueKey('remove-inv')), findsNothing);
  });

  testWidgets('removed fees sit in a collapsible list', (tester) async {
    await pumpLive(tester);

    expect(find.text('Old fee'), findsNothing);
    await tapText(tester, 'Show 1 removed fee');
    expect(find.text('Old fee'), findsOneWidget);
    expect(find.text('Duplicate'), findsOneWidget);
  });

  testWidgets('removing a fee sends the chosen reason', (tester) async {
    await pumpLive(tester);

    await tester.ensureVisible(find.byKey(const ValueKey('remove-dep')));
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('remove-dep')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Waived for the tenant'));
    await tester.pump();
    await tester.tap(find.text('Remove fee'));
    await tester.pumpAndSettle();

    expect(FakeVoid.calls, [
      {'chargeId': 'dep', 'reason': 'Waived for the tenant'},
    ]);
  });

  testWidgets('staff get no actions', (tester) async {
    await pumpLive(
      tester,
      detail: account(paidDeposit: true),
      roles: const {'p1': 'STAFF'},
    );

    expect(find.text('Ama still owes you'), findsOneWidget);
    expect(find.text('Ama paid me'), findsNothing);
    expect(find.text('Add a fee'), findsNothing);
    expect(find.byKey(const ValueKey('remove-dep')), findsNothing);
    expect(find.text('Change'), findsNothing);
    expect(find.text('Change the rent'), findsNothing);
    expect(find.text('Refund a payment'), findsNothing);
  });

  testWidgets('no refund is offered before anything is paid', (tester) async {
    await pumpLive(tester);

    expect(find.text('Refund a payment'), findsNothing);
  });

  testWidgets('a refund is offered once something was paid', (tester) async {
    await pumpLive(tester, detail: account(paidDeposit: true));

    expect(find.text('Refund a payment'), findsOneWidget);
  });

  testWidgets('locked rent says it is fixed and offers no change', (
    tester,
  ) async {
    await pumpLive(tester, detail: account(billedRent: true));

    expect(find.textContaining('Rent is fixed now'), findsOneWidget);
    expect(find.text('Change the rent'), findsNothing);
  });

  testWidgets('choosing quarterly saves every 3 periods', (tester) async {
    await pumpLive(tester);

    await tapText(tester, 'Change');
    await tester.tap(find.text('Every 3 months'));
    await tester.pumpAndSettle();

    expect(FakePolicy.calls, [BillingChoice.quarterly]);
    final cadence = cadenceForChoice(FakePolicy.calls.single);
    expect(cadence.cadence, 'EVERY_N_PERIODS');
    expect(cadence.interval, 3);
  });

  testWidgets('a new rent is patched in pesewas', (tester) async {
    await pumpLive(tester);

    await tapText(tester, 'Change the rent');
    await tester.enterText(find.byType(TextField), '2500');
    await tester.pump();
    await tester.tap(find.text('Save the new rent'));
    await tester.pumpAndSettle();

    expect(FakeUpdate.calls, [
      {'rent_fee': 250000},
    ]);
  });

  testWidgets('a refused rent change shows the translated message', (
    tester,
  ) async {
    FakeUpdate.result = UpdateApplicationState(
      status: ApiStatus.failed,
      errorMessage:
          'Rent has already been billed, so this can no longer be changed.',
    );
    await pumpLive(tester);

    await tapText(tester, 'Change the rent');
    await tester.enterText(find.byType(TextField), '2500');
    await tester.pump();
    await tester.tap(find.text('Save the new rent'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Rent has already been billed, so this can no longer be changed.',
      ),
      findsOneWidget,
    );
  });

  final paidAlready = find.textContaining('Already been paid?');

  Map<String, dynamic> dueSoon() => _charge(
    'soon',
    'Water',
    'OTHER',
    30000,
    DateTime.now().toUtc().add(const Duration(days: 2)).toIso8601String(),
  );

  testWidgets('a first bill about to go out asks if they already paid', (
    tester,
  ) async {
    await pumpLive(
      tester,
      detail: account(extra: [dueSoon()], billedFee: false),
    );

    expect(paidAlready, findsOneWidget);
    expect(
      find.textContaining('before the first bill goes out tonight'),
      findsOne,
    );
    expect(find.text('Ama paid me'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('paid-already')),
        matching: find.byType(RLBtn),
      ),
      findsNothing,
    );
  });

  testWidgets('no prepaid prompt when nothing is due soon', (tester) async {
    await pumpLive(tester);

    expect(paidAlready, findsNothing);
  });

  testWidgets('staff never see the prepaid prompt', (tester) async {
    await pumpLive(
      tester,
      detail: account(extra: [dueSoon()], billedFee: false),
      roles: const {'p1': 'STAFF'},
    );

    expect(paidAlready, findsNothing);
  });

  testWidgets('the rent row says its dates are due dates', (tester) async {
    await pumpLive(tester);

    expect(find.text('Due 1 Jan 2030 to 1 Jun 2030'), findsOneWidget);
  });

  testWidgets('a refund sits apart from the rent count', (tester) async {
    await pumpLive(
      tester,
      detail: account(
        extra: [
          {
            ..._charge(
              'back',
              'Refund — Rent 1',
              'RENT',
              -50000,
              '2030-01-05T00:00:00Z',
            ),
            'reverses_charge_instance_id': 'r0',
          },
        ],
      ),
    );

    expect(find.text('6 payments · GH₵ 12,000.00'), findsOneWidget);
    expect(find.text('Refund — Rent 1'), findsOneWidget);
    expect(find.text('Refunded · 5 Jan 2030'), findsOneWidget);
  });

  testWidgets('an automatic plan says bills go out on their own', (
    tester,
  ) async {
    await pumpLive(tester);

    expect(find.text('Ama’s bills go out on their own from here.'), findsOne);
  });

  testWidgets('a manual plan says to record payments as they come', (
    tester,
  ) async {
    await pumpLive(tester, detail: account(cadence: 'MANUAL'));

    expect(find.text('Record payments here as they come in.'), findsOne);
    expect(find.textContaining('go out on their own'), findsNothing);
  });
}
