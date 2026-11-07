import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/add_fee_sheet.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/add_fee_notifier.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

import 'harness.dart';

class FakeAddFee extends AddFeeNotifier {
  static final calls = <Map<String, Object?>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required String name,
    required String category,
    required int amount,
    required String currency,
    required DateTime dueDate,
  }) async {
    calls.add({
      'accountId': accountId,
      'name': name,
      'category': category,
      'amount': amount,
      'currency': currency,
      'dueDate': dueDate,
    });
    state = AddFeeState(status: ApiStatus.success);
  }

  void hold() => state = AddFeeState(status: ApiStatus.pending);
}

Future<void> pumpSheet(WidgetTester tester) async {
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(
        const MethodChannel('haptic_feedback'),
        (_) async => null,
      );
  tester.view.physicalSize = const Size(800, 3200);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [addFeeNotifierProvider.overrideWith(FakeAddFee.new)],
      child: MaterialApp(
        home: Scaffold(
          body: AddFeeSheet(
            application: application(rentFee: 200000),
            propertyId: 'p1',
            accountId: 'fa',
            onClose: () {},
          ),
        ),
      ),
    ),
  );
  await tester.pump();
}

void main() {
  setUp(FakeAddFee.calls.clear);

  testWidgets('save is off until a type, a name and an amount are set', (
    tester,
  ) async {
    await pumpSheet(tester);

    await tester.tap(find.text('Add this fee'));
    await tester.pump();
    expect(FakeAddFee.calls, isEmpty);

    await tester.tap(find.text('Water or electricity'));
    await tester.pump();
    await tester.tap(find.text('Add this fee'));
    await tester.pump();
    expect(FakeAddFee.calls, isEmpty);
  });

  testWidgets('choosing a type prefills the name; save sends the fee', (
    tester,
  ) async {
    await pumpSheet(tester);

    await tester.tap(find.text('Water or electricity'));
    await tester.pump();
    expect(find.widgetWithText(TextField, 'Water or electricity'), findsOne);

    await tester.enterText(find.byType(TextField).at(1), '45.50');
    await tester.pump();
    await tester.tap(find.text('Add this fee'));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));

    expect(FakeAddFee.calls, hasLength(1));
    final call = FakeAddFee.calls.single;
    expect(call['category'], 'UTILITY');
    expect(call['name'], 'Water or electricity');
    expect(call['amount'], 4550);
    expect(call['accountId'], 'fa');
    expect(call['currency'], 'GHS');
    expect(call['dueDate'], DateTime.parse('2026-09-01T00:00:00Z'));
  });

  testWidgets('something else leaves the name blank', (tester) async {
    await pumpSheet(tester);

    await tester.tap(find.text('Something else'));
    await tester.pump();
    await tester.enterText(find.byType(TextField).at(1), '10');
    await tester.pump();
    await tester.tap(find.text('Add this fee'));
    await tester.pump();

    expect(FakeAddFee.calls, isEmpty);
  });

  testWidgets('the sheet cannot be dismissed while the fee saves', (
    tester,
  ) async {
    await pumpSheet(tester);
    expect(sheetLocked(tester), isFalse);

    (ProviderScope.containerOf(
              tester.element(find.byType(AddFeeSheet)),
            ).read(addFeeNotifierProvider.notifier)
            as FakeAddFee)
        .hold();
    await tester.pump();

    expect(sheetLocked(tester), isTrue);
  });
}

bool sheetLocked(WidgetTester tester) =>
    !tester.widget<RLSheet>(find.byType(RLSheet)).dismissible;
