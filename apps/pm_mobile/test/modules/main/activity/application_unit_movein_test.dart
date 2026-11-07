import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_data.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/unit_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_detail_provider.dart';

import '../../../support/options_fakes.dart';

TenantApplicationModel _app({
  bool locked = false,
  int chargeCount = 0,
  String? docStatus,
  DateTime? moveIn,
}) => TenantApplicationModel.fromJson({
  'id': 'a1',
  'code': 'APP-1',
  'status': 'TenantApplication.Status.InProgress',
  'property_id': 'p1',
  'first_name': 'Ama',
  'last_name': 'Mensah',
  'rent_fee': 70000,
  'stay_duration': 6,
  'stay_duration_frequency': 'MONTHLY',
  'desired_move_in_date':
      (moveIn ?? DateTime.now().add(const Duration(days: 30)))
          .toUtc()
          .toIso8601String(),
  'desired_unit': {
    'id': 'u1',
    'name': 'Unit One',
    'type': 'APARTMENT',
    'status': 'Unit.Status.Available',
    'rent_fee': 50000,
    'rent_fee_currency': 'GHS',
    'payment_frequency': 'MONTHLY',
    'property_id': 'p1',
  },
  'financial_account': {
    'rent_terms_locked': locked,
    'charge_count': chargeCount,
  },
  if (docStatus != null) 'lease_agreement_document_status': docStatus,
});

UnitModel _unit(String id, String name, String frequency) => UnitModel(
  id: id,
  name: name,
  type: 'APARTMENT',
  status: 'Unit.Status.Available',
  rentFee: 99000,
  rentFeeCurrency: 'GHS',
  paymentFrequency: frequency,
  propertyId: 'p1',
);

class _FakeUpdate extends UpdateApplicationNotifier {
  static final patches = <Map<String, dynamic>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
    String? accountId,
  }) async {
    patches.add(patch);
    state = UpdateApplicationState(status: ApiStatus.success);
  }
}

Future<void> _pump(
  WidgetTester tester,
  TenantApplicationModel app,
  Widget Function(ApplicationDetailData d) page, {
  String propertyType = 'MULTI',
}) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) =>
            page(ApplicationDetailData.fromApplicationModel(app)),
      ),
      GoRoute(
        path: '/properties/:id/units/:unitId',
        builder: (_, s) => Text(
          'unit-detail ${s.pathParameters['id']} ${s.pathParameters['unitId']}',
        ),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async => app),
        unitOptionsNotifierProvider(
          const UnitOptionsQuery(propertyIds: ['p1'], bookableOnly: true),
        ).overrideWith(
          () => FakeUnitOptions([
            _unit('u1', 'Unit One', 'MONTHLY'),
            _unit('u2', 'Unit Two', 'WEEKLY'),
          ]),
        ),
        propertyDetailProvider('p1').overrideWith(
          (ref) async => PropertyModel(
            id: 'p1',
            name: 'Prop',
            type: propertyType,
            status: 'Property.Status.Active',
          ),
        ),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': 'MANAGER'}),
        updateApplicationNotifierProvider.overrideWith(_FakeUpdate.new),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
}

Widget _unitPage(ApplicationDetailData d, {bool readOnly = false}) =>
    ApplicationUnitPage(data: d, propertyId: 'p1', readOnly: readOnly);

Widget _moveInPage(ApplicationDetailData d) =>
    ApplicationMoveInPage(data: d, propertyId: 'p1');

void main() {
  setUp(() {
    _FakeUpdate.patches.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('changing the unit sends the unit terms and keeps the rent', (
    tester,
  ) async {
    await _pump(tester, _app(), _unitPage);
    await tester.tap(find.text('Change'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Unit Two'));
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(_FakeUpdate.patches.single, {
      'desired_unit_id': 'u2',
      'rent_fee': 70000,
      'rent_fee_currency': 'GHS',
      'payment_frequency': 'WEEKLY',
      'stay_duration_frequency': 'WEEKLY',
    });
  });

  testWidgets('locked rent terms hide Change and explain why', (tester) async {
    await _pump(tester, _app(locked: true), _unitPage);

    expect(find.text('Change'), findsNothing);
    expect(
      find.text("Rent has already been billed, so the unit can't be changed."),
      findsOneWidget,
    );
  });

  testWidgets('a signed lease hides Change', (tester) async {
    await _pump(tester, _app(docStatus: 'SIGNED'), _unitPage);

    expect(find.text('Change'), findsNothing);
  });

  testWidgets('a single-unit property hides Change', (tester) async {
    await _pump(tester, _app(), _unitPage, propertyType: 'SINGLE');

    expect(find.text('Change'), findsNothing);
  });

  testWidgets('View unit opens the unit detail route', (tester) async {
    await _pump(tester, _app(), _unitPage);
    await tester.tap(find.text('View unit'));
    await tester.pumpAndSettle();

    expect(find.text('unit-detail p1 u1'), findsOneWidget);
  });

  testWidgets('move-in save sends an RFC3339 date and the duration', (
    tester,
  ) async {
    await _pump(tester, _app(), _moveInPage);
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, '6'), '12');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final patch = _FakeUpdate.patches.single;
    expect(patch['stay_duration'], 12);
    expect(patch['stay_duration_frequency'], 'MONTHLY');
    expect(
      patch['desired_move_in_date'],
      matches(RegExp(r'^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$')),
    );
  });

  testWidgets('existing charges ask for confirmation before saving', (
    tester,
  ) async {
    await _pump(tester, _app(chargeCount: 2), _moveInPage);
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, '6'), '9');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Changing this will recalculate the rent for this tenant. Continue?',
      ),
      findsOneWidget,
    );
    expect(_FakeUpdate.patches, isEmpty);

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(_FakeUpdate.patches, hasLength(1));
  });

  testWidgets('an unchanged past move-in date still lets the duration change', (
    tester,
  ) async {
    final past = DateTime.now().subtract(const Duration(days: 10));
    await _pump(tester, _app(moveIn: past), _moveInPage);
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();

    expect(find.text("Move-in date can't be in the past."), findsNothing);
    await tester.enterText(find.widgetWithText(TextField, '6'), '12');
    await tester.pump();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final patch = _FakeUpdate.patches.single;
    expect(patch['stay_duration'], 12);
    final sent = DateTime.parse(patch['desired_move_in_date'] as String);
    expect(
      [sent.year, sent.month, sent.day],
      [past.year, past.month, past.day],
    );
  });

  testWidgets('a move-in date in the past can be picked and saved', (
    tester,
  ) async {
    final past = DateTime.now().subtract(const Duration(days: 90));
    await _pump(tester, _app(), _moveInPage);
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.calendar_today_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Switch to input'));
    await tester.pumpAndSettle();
    final typed =
        '${past.month.toString().padLeft(2, '0')}/'
        '${past.day.toString().padLeft(2, '0')}/${past.year}';
    await tester.enterText(
      find.descendant(
        of: find.byType(DatePickerDialog),
        matching: find.byType(TextField),
      ),
      typed,
    );
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();

    expect(find.byType(DatePickerDialog), findsNothing);
    expect(find.text("Move-in date can't be in the past."), findsNothing);
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    final sent = DateTime.parse(
      _FakeUpdate.patches.single['desired_move_in_date'] as String,
    );
    expect(
      [sent.year, sent.month, sent.day],
      [past.year, past.month, past.day],
    );
  });

  testWidgets('saving unchanged terms skips the recalculation question', (
    tester,
  ) async {
    await _pump(tester, _app(chargeCount: 2), _moveInPage);
    await tester.tap(find.text('Edit'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(find.text('Continue'), findsNothing);
    expect(_FakeUpdate.patches, hasLength(1));
  });

  testWidgets('locked rent terms make move-in read-only', (tester) async {
    await _pump(tester, _app(locked: true), _moveInPage);

    expect(find.text('Edit'), findsNothing);
  });
}
