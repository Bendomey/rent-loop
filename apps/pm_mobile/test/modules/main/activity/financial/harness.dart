import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/financial/financial_page.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/start_billing_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

typedef Fee = ({String name, String category, int amount});

class FakeStartBilling extends StartBillingNotifier {
  static final calls = <Map<String, Object?>>[];
  static StartBillingState result = StartBillingState(
    status: ApiStatus.success,
    accountId: 'fa',
  );

  @override
  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String? existingAccountId,
    required int rentMinor,
    required String currency,
    required List<Fee> fees,
    required BillingChoice choice,
    required int leadDays,
    required DateTime moveIn,
  }) async {
    calls.add({
      'rentMinor': rentMinor,
      'currency': currency,
      'fees': fees,
      'choice': choice,
      'leadDays': leadDays,
      'moveIn': moveIn,
      'existingAccountId': existingAccountId,
    });
    state = result;
  }
}

TenantApplicationModel application({
  bool moveInSet = true,
  int? rentFee,
  Map<String, dynamic> extra = const {},
}) => TenantApplicationModel.fromJson({
  'id': 'a1',
  'code': 'APP-1',
  'status': 'TenantApplication.Status.InProgress',
  'property_id': 'p1',
  'first_name': 'Ama',
  'last_name': 'Mensah',
  'rent_fee_currency': 'GHS',
  if (rentFee != null) 'rent_fee': rentFee,
  'desired_unit': {
    'id': 'u1',
    'name': 'Unit 1',
    'type': 'APARTMENT',
    'status': 'Unit.Status.Available',
    'rent_fee': 200000,
    'rent_fee_currency': 'GHS',
    'payment_frequency': 'MONTHLY',
  },
  if (moveInSet) ...{
    'desired_move_in_date': '2026-09-01T00:00:00Z',
    'stay_duration': 12,
    'stay_duration_frequency': 'MONTHS',
  },
  ...extra,
});

Future<void> pumpFinancialPage(
  WidgetTester tester,
  TenantApplicationModel app, {
  Map<String, String> roles = const {'p1': 'MANAGER'},
  FinancialAccountDetailModel? account,
  List<Override> overrides = const [],
}) async {
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
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async => app),
        myPropertyRolesProvider.overrideWith((ref) async => roles),
        startBillingNotifierProvider.overrideWith(FakeStartBilling.new),
        if (account != null)
          financialAccountProvider(
            'p1',
            'fa',
          ).overrideWith((ref) async => account),
        ...overrides,
      ],
      child: MaterialApp(
        home: ApplicationFinancialPage(
          data: ApplicationDetailData.fromApplicationModel(app),
          propertyId: 'p1',
        ),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

Future<void> tapSave(WidgetTester tester) async {
  final save = find.text('Save this and start billing');
  await tester.ensureVisible(save);
  await tester.pump();
  await tester.tap(save);
  await tester.pumpAndSettle();
}
