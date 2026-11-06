import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/record_payment_sheet.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/record_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/payment_accounts_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

import 'harness.dart';

class FakeRecordPayment extends RecordPaymentNotifier {
  static final calls = <Map<String, Object?>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required List<({String chargeId, int amount})> claims,
    required String paymentAccountId,
    required String provider,
  }) async {
    calls.add({
      'claims': [for (final c in claims) '${c.chargeId}:${c.amount}'],
      'paymentAccountId': paymentAccountId,
      'provider': provider,
    });
    state = RecordPaymentState(status: ApiStatus.success);
  }

  void hold() => state = RecordPaymentState(status: ApiStatus.pending);
}

Map<String, dynamic> _charge(String id, int amount, String due) => {
  'id': id,
  'name': 'Rent $id',
  'category': 'RENT',
  'amount': amount,
  'currency': 'GHS',
  'due_date': due,
  'invoiced_amount': 0,
  'settled_amount': 0,
  'outstanding_amount': amount,
  'status': 'OPEN',
};

FinancialAccountDetailModel detail({bool billed = false}) =>
    FinancialAccountDetailModel.fromJson({
      'account': {
        'id': 'fa',
        'currency': 'GHS',
        'rent_billing_cadence': 'EVERY_PERIOD',
        'rent_billing_interval': 0,
        'auto_issue_days_before': 5,
        'status': 'ACTIVE',
      },
      'charges': [
        for (var i = 0; i < 6; i++)
          {
            ..._charge('r$i', 100000, '2030-0${i + 1}-01T00:00:00Z'),
            if (billed) 'invoiced_amount': 100000,
          },
      ],
      'total_charged': 600000,
      'total_settled': 0,
      'outstanding_amount': 600000,
      'available_credit': 0,
    });

final _accounts = [
  PaymentAccountModel(
    id: 'pa1',
    rail: 'MOMO',
    identifier: '0240000000',
    isDefault: true,
  ),
  PaymentAccountModel(id: 'pa2', rail: 'BANK_TRANSFER', identifier: '123'),
];

Future<void> pumpSheet(
  WidgetTester tester, {
  FinancialAccountDetailModel? account,
  List<PaymentAccountModel>? accounts,
}) async {
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
      overrides: [
        recordPaymentNotifierProvider.overrideWith(FakeRecordPayment.new),
        paymentAccountsProvider.overrideWith(
          (ref) async => accounts ?? _accounts,
        ),
      ],
      child: MaterialApp(
        home: Scaffold(
          body: RecordPaymentSheet(
            application: application(rentFee: 100000),
            detail: account ?? detail(),
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
  setUp(FakeRecordPayment.calls.clear);

  testWidgets('a typed amount fills oldest first and marks the part', (
    tester,
  ) async {
    await pumpSheet(tester);

    await tester.enterText(find.byType(TextField).first, '5500');
    await tester.pump();
    expect(find.textContaining('Part'), findsOneWidget);

    await tester.tap(find.text('Save this payment'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));

    expect(FakeRecordPayment.calls.single, {
      'claims': [
        'r0:100000',
        'r1:100000',
        'r2:100000',
        'r3:100000',
        'r4:100000',
        'r5:50000',
      ],
      'paymentAccountId': 'pa1',
      'provider': 'CASH',
    });
  });

  testWidgets('ticking two charges sends exactly those two', (tester) async {
    await pumpSheet(tester);

    await tester.tap(find.text('Rent r3'));
    await tester.tap(find.text('Rent r1'));
    await tester.pump();
    await tester.tap(find.text('MTN MoMo'));
    await tester.pump();
    await tester.tap(find.text('Bank Transfer · 123'));
    await tester.pump();
    await tester.tap(find.text('Save this payment'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));

    expect(FakeRecordPayment.calls.single, {
      'claims': ['r1:100000', 'r3:100000'],
      'paymentAccountId': 'pa2',
      'provider': 'MTN',
    });
  });

  testWidgets('they paid everything ticks all, clear resets', (tester) async {
    await pumpSheet(tester);

    await tester.tap(find.textContaining('They paid everything'));
    await tester.pump();
    expect(find.text('Recording GH₵ 6,000.00'), findsOneWidget);

    await tester.tap(find.text('Clear'));
    await tester.pump();
    expect(find.text('Recording GH₵ 0.00'), findsOneWidget);
  });

  testWidgets('without payment accounts save is off and the hint shows', (
    tester,
  ) async {
    await pumpSheet(tester, accounts: const []);

    expect(find.text('Add a payment account on the web first.'), findsOne);
    await tester.tap(find.text('Rent r0'));
    await tester.pump();
    await tester.tap(find.text('Save this payment'));
    await tester.pump();

    expect(FakeRecordPayment.calls, isEmpty);
  });

  testWidgets('nothing payable shows the empty state', (tester) async {
    await pumpSheet(tester, account: detail(billed: true));

    expect(
      find.text(
        'Everything is already on a bill. Record it from the bill on the web.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('the sheet cannot be dismissed while the payment saves', (
    tester,
  ) async {
    await pumpSheet(tester);
    expect(sheetLocked(tester), isFalse);

    final notifier =
        ProviderScope.containerOf(
              tester.element(find.byType(RecordPaymentSheet)),
            ).read(recordPaymentNotifierProvider.notifier)
            as FakeRecordPayment;
    notifier.hold();
    await tester.pump();

    expect(sheetLocked(tester), isTrue);
  });

  testWidgets('they paid everything fills the field in plain cedis', (
    tester,
  ) async {
    await pumpSheet(tester);

    await tester.tap(find.textContaining('They paid everything'));
    await tester.pump();

    expect(find.widgetWithText(TextField, '6000'), findsOneWidget);
    expect(find.textContaining('more than'), findsNothing);
  });

  testWidgets('the typed field says the deposit and fees are filled too', (
    tester,
  ) async {
    await pumpSheet(tester);

    expect(
      find.text('Fills the oldest first, including the deposit and fees.'),
      findsOneWidget,
    );
  });

  testWidgets('typing more than is owed says only the total is recorded', (
    tester,
  ) async {
    await pumpSheet(tester);

    await tester.enterText(find.byType(TextField).first, '7000');
    await tester.pump();

    expect(
      find.text(
        "That's GH₵ 1,000.00 more than Ama owes. Only GH₵ 6,000.00 will be "
        'recorded.',
      ),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField).first, '6000');
    await tester.pump();
    expect(find.textContaining('more than Ama owes'), findsNothing);
  });

  testWidgets('charges already on a bill are listed apart, not payable', (
    tester,
  ) async {
    final base = detail();
    final charges = [for (final c in base.charges) c.toJson()];
    charges[0]['invoiced_amount'] = 100000;
    charges[1]['invoiced_amount'] = 100000;
    charges[1]['settled_amount'] = 40000;
    charges[2]['invoiced_amount'] = 100000;
    charges[2]['settled_amount'] = 100000;
    final account = FinancialAccountDetailModel.fromJson({
      ...base.toJson(),
      'account': base.account.toJson(),
      'charges': charges,
    });
    await pumpSheet(tester, account: account);

    expect(
      find.text('Already on a bill — record that one on the web.'),
      findsOneWidget,
    );
    expect(find.text('Rent r0'), findsOneWidget);
    expect(find.text('Rent r1'), findsOneWidget);
    expect(find.text('Rent r2'), findsNothing);
    expect(find.text('GH₵ 600.00'), findsOneWidget);

    await tester.tap(find.textContaining('They paid everything'));
    await tester.pump();
    expect(find.text('Recording GH₵ 3,000.00'), findsOneWidget);
  });
}

bool sheetLocked(WidgetTester tester) =>
    !tester.widget<RLSheet>(find.byType(RLSheet)).dismissible;
