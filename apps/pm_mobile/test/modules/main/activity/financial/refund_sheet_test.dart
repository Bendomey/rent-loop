import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/refund_sheet.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/refund_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

import 'harness.dart';

class FakeRefund extends RefundNotifier {
  static final calls = <List<String>>[];
  static RefundState result = RefundState(status: ApiStatus.success);

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required List<({ChargeModel charge, int amount})> refunds,
  }) async {
    calls.add([for (final r in refunds) '${r.charge.id}:${r.amount}']);
    state = result;
  }

  void hold() => state = RefundState(status: ApiStatus.pending);
}

Map<String, dynamic> _charge(
  String id,
  String name,
  int amount,
  int settled, {
  String? voidedAt,
}) => {
  'id': id,
  'name': name,
  'category': 'RENT',
  'amount': amount,
  'currency': 'GHS',
  'due_date': '2030-01-01T00:00:00Z',
  'invoiced_amount': settled,
  'settled_amount': settled,
  'outstanding_amount': amount - settled,
  'status': 'OPEN',
  if (voidedAt != null) 'voided_at': voidedAt,
};

FinancialAccountDetailModel detail() => FinancialAccountDetailModel.fromJson({
  'account': {
    'id': 'fa',
    'currency': 'GHS',
    'rent_billing_cadence': 'EVERY_PERIOD',
    'rent_billing_interval': 0,
    'auto_issue_days_before': 5,
    'status': 'ACTIVE',
  },
  'charges': [
    _charge('dep', 'Security deposit', 300000, 300000),
    _charge('rent', 'Rent', 100000, 100000),
    _charge('unpaid', 'Parking', 50000, 0),
    _charge(
      'gone',
      'Voided fee',
      20000,
      20000,
      voidedAt: '2030-01-02T00:00:00Z',
    ),
    {
      ..._charge('back', 'Refund — Furniture', -30000, 0),
      'reverses_charge_instance_id': 'part',
    },
    _charge('part', 'Furniture', 80000, 80000),
    _charge('done', 'Cleaning', 20000, 20000),
    {
      ..._charge('done-r', 'Refund — Cleaning', -20000, 0),
      'reverses_charge_instance_id': 'done',
    },
  ],
  'total_charged': 0,
  'total_settled': 0,
  'outstanding_amount': 0,
  'available_credit': 0,
});

Future<void> pumpSheet(WidgetTester tester) async {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [refundNotifierProvider.overrideWith(FakeRefund.new)],
      child: MaterialApp(
        home: Scaffold(
          body: RefundSheet(
            application: application(rentFee: 100000),
            detail: detail(),
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
    FakeRefund.calls.clear();
    FakeRefund.result = RefundState(status: ApiStatus.success);
  });

  testWidgets('lists only refundable charges with what was paid', (
    tester,
  ) async {
    await pumpSheet(tester);
    expect(find.text('Security deposit'), findsOneWidget);
    expect(find.text('Rent'), findsOneWidget);
    expect(find.text('Parking'), findsNothing);
    expect(find.text('Voided fee'), findsNothing);
    expect(find.text('Refund — Rent'), findsNothing);
    expect(find.textContaining('3,000.00'), findsWidgets);
    expect(
      find.text(
        'This only records the refund. Give the money back to the tenant '
        'yourself.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('record refund is disabled until something is ticked', (
    tester,
  ) async {
    await pumpSheet(tester);
    await tester.tap(find.text('Record refund'));
    await tester.pump();
    expect(FakeRefund.calls, isEmpty);
  });

  testWidgets('ticking the deposit refunds its full settled amount', (
    tester,
  ) async {
    await pumpSheet(tester);
    await tester.tap(find.text('Security deposit'));
    await tester.pump();
    await tester.tap(find.text('Record refund'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 5));
    expect(FakeRefund.calls, [
      ['dep:300000'],
    ]);
  });

  testWidgets('a partial failure lists the names that failed', (tester) async {
    FakeRefund.result = RefundState(
      status: ApiStatus.success,
      failedNames: ['Security deposit', 'Rent'],
      failedIds: ['dep', 'rent'],
    );
    await pumpSheet(tester);
    await tester.tap(find.text('Security deposit'));
    await tester.pump();
    await tester.tap(find.text('Record refund'));
    await tester.pump();
    expect(
      find.text('These refunds could not be recorded: Security deposit, Rent'),
      findsOneWidget,
    );
  });

  testWidgets(
    'a second tap after a partial failure sends only the failed one',
    (tester) async {
      FakeRefund.result = RefundState(
        status: ApiStatus.success,
        failedNames: ['Rent'],
        failedIds: ['rent'],
      );
      await pumpSheet(tester);
      await tester.tap(find.text('Security deposit'));
      await tester.tap(find.text('Rent'));
      await tester.pump();
      await tester.tap(find.text('Record refund'));
      await tester.pump();
      expect(find.text('Security deposit'), findsNothing);
      FakeRefund.result = RefundState(status: ApiStatus.success);
      await tester.tap(find.text('Record refund'));
      await tester.pump(const Duration(seconds: 5));
      expect(FakeRefund.calls.last, ['rent:100000']);
    },
  );

  testWidgets('refunds only what is left after a prior refund', (tester) async {
    await pumpSheet(tester);
    expect(find.text('Cleaning'), findsNothing);
    expect(find.text('Furniture'), findsOneWidget);
    expect(find.textContaining('500.00'), findsWidgets);
  });

  testWidgets('the sheet cannot be dismissed while the refund saves', (
    tester,
  ) async {
    await pumpSheet(tester);
    expect(sheetLocked(tester), isFalse);

    (ProviderScope.containerOf(
              tester.element(find.byType(RefundSheet)),
            ).read(refundNotifierProvider.notifier)
            as FakeRefund)
        .hold();
    await tester.pump();

    expect(sheetLocked(tester), isTrue);
  });
}

bool sheetLocked(WidgetTester tester) =>
    !tester.widget<RLSheet>(find.byType(RLSheet)).dismissible;
