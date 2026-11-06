import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/lib/application_utils.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail_pages.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/cancel_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/widgets.dart';

const _inProgress = 'TenantApplication.Status.InProgress';
const _cancelled = 'TenantApplication.Status.Cancelled';

TenantApplicationModel _app({
  String status = _inProgress,
  int? totalSettled,
  Map<String, dynamic> extra = const {},
}) => TenantApplicationModel.fromJson({
  'id': 'a1',
  'code': 'APP-1',
  'status': status,
  'property_id': 'p1',
  'first_name': 'Ama',
  'last_name': 'Mensah',
  if (totalSettled != null)
    'financial_account': {'id': 'fa', 'total_settled': totalSettled},
  ...extra,
});

class _FakeCancel extends CancelApplicationNotifier {
  static final calls = <Map<String, String>>[];

  @override
  Future<void> submit({
    required String propertyId,
    required String id,
    required String reason,
  }) async {
    calls.add({'propertyId': propertyId, 'id': id, 'reason': reason});
  }
}

Future<void> _pump(
  WidgetTester tester, {
  required Future<TenantApplicationModel> Function() fetch,
  Map<String, String> roles = const {'p1': 'MANAGER'},
  Future<Map<String, String>> Function()? fetchRoles,
}) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) => fetch()),
        myPropertyRolesProvider.overrideWith(
          (ref) => fetchRoles?.call() ?? Future.value(roles),
        ),
        cancelApplicationNotifierProvider.overrideWith(_FakeCancel.new),
      ],
      child: const MaterialApp(
        home: ApplicationDetailScreen(id: 'a1', propertyId: 'p1'),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

Future<void> _openTenantPage(WidgetTester tester) async {
  await tester.tap(find.text('Add tenant details'));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    _FakeCancel.calls.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  group('canEditApplication', () {
    test('needs an in-progress application and a MANAGER role', () {
      expect(canEditApplication(_app(), {'p1': 'MANAGER'}), isTrue);
      expect(canEditApplication(_app(), {'p1': 'STAFF'}), isFalse);
      expect(canEditApplication(_app(), null), isFalse);
      expect(
        canEditApplication(_app(status: _cancelled), {'p1': 'MANAGER'}),
        isFalse,
      );
      expect(
        canEditApplication(_app(status: 'TenantApplication.Status.Completed'), {
          'p1': 'MANAGER',
        }),
        isFalse,
      );
    });
  });

  testWidgets('shows a skeleton while the application loads', (tester) async {
    final never = Completer<TenantApplicationModel>();
    await _pump(tester, fetch: () => never.future);

    expect(find.text('Tenant setup #APP-1'), findsNothing);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(
      find.byKey(const ValueKey('application-detail-skeleton')),
      findsOneWidget,
    );
  });

  testWidgets('shows the tenant setup hero once loaded', (tester) async {
    await _pump(tester, fetch: () async => _app());

    expect(find.text('Tenant setup #APP-1'), findsOneWidget);
  });

  testWidgets('a failed fetch offers Retry', (tester) async {
    await _pump(tester, fetch: () async => throw Exception('boom'));

    expect(find.byType(RLSectionError), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('a cancelled setup is read-only', (tester) async {
    await _pump(tester, fetch: () async => _app(status: _cancelled));

    expect(find.text('Cancelled'), findsWidgets);
    expect(find.text('Cancel tenant setup'), findsNothing);
    await _openTenantPage(tester);
    expect(find.byIcon(Icons.edit_outlined), findsNothing);
  });

  testWidgets('STAFF cannot cancel or edit', (tester) async {
    await _pump(
      tester,
      fetch: () async => _app(),
      roles: const {'p1': 'STAFF'},
    );

    expect(find.text('Cancel tenant setup'), findsNothing);
    await _openTenantPage(tester);
    expect(find.byIcon(Icons.edit_outlined), findsNothing);
  });

  testWidgets('MANAGER can cancel and edit', (tester) async {
    await _pump(tester, fetch: () async => _app());

    expect(find.text('Cancel tenant setup'), findsOneWidget);
    await _openTenantPage(tester);
    expect(find.byIcon(Icons.edit_outlined), findsWidgets);
  });

  testWidgets('cancel is disabled once payments were recorded', (tester) async {
    await _pump(tester, fetch: () async => _app(totalSettled: 5000));

    expect(
      find.text('Payments were recorded — refund them first'),
      findsOneWidget,
    );
    await tester.tap(find.text('Cancel tenant setup'));
    await tester.pumpAndSettle();
    expect(find.text('Cancel tenant setup?'), findsNothing);
  });

  testWidgets('the cancel sheet needs a reason before it submits', (
    tester,
  ) async {
    await _pump(tester, fetch: () async => _app());

    await tester.tap(find.text('Cancel tenant setup'));
    await tester.pumpAndSettle();
    expect(find.text('Cancel tenant setup?'), findsOneWidget);

    final submit = find.widgetWithText(RLBtn, 'Cancel tenant setup').last;
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(_FakeCancel.calls, isEmpty);

    await tester.enterText(find.byType(TextField), 'Tenant changed their mind');
    await tester.pump();
    await tester.tap(submit);
    await tester.pumpAndSettle();

    expect(_FakeCancel.calls, [
      {'propertyId': 'p1', 'id': 'a1', 'reason': 'Tenant changed their mind'},
    ]);
  });

  testWidgets('Approve and the document menu stay hidden for now', (
    tester,
  ) async {
    await _pump(tester, fetch: () async => _app());

    expect(find.text('Approve'), findsNothing);
    expect(find.byIcon(Icons.more_horiz), findsNothing);
    expect(find.text('Cancel tenant setup'), findsOneWidget);

    await tester.tap(find.text('Financial setup'));
    await tester.pumpAndSettle();
    expect(find.byType(EditButton), findsNothing);
    expect(find.text('Generate Invoice'), findsNothing);
    expect(find.text('Finish this step on the web for now.'), findsOneWidget);
    Navigator.of(tester.element(find.byType(ApplicationFinancialPage))).pop();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Lease docs setup'));
    await tester.pumpAndSettle();
    expect(find.byType(EditButton), findsNothing);
    expect(find.byIcon(Icons.more_horiz), findsNothing);
    expect(find.text('Finish this step on the web for now.'), findsOneWidget);
  });

  testWidgets('STAFF is not told to finish on the web', (tester) async {
    await _pump(
      tester,
      fetch: () async => _app(),
      roles: const {'p1': 'STAFF'},
    );

    await tester.tap(find.text('Financial setup'));
    await tester.pumpAndSettle();
    expect(find.text('Finish this step on the web for now.'), findsNothing);
  });

  testWidgets('a section opened before roles load gains Edit once they do', (
    tester,
  ) async {
    final roles = Completer<Map<String, String>>();
    await _pump(
      tester,
      fetch: () async => _app(),
      fetchRoles: () => roles.future,
    );

    await _openTenantPage(tester);
    expect(find.byIcon(Icons.edit_outlined), findsNothing);

    roles.complete({'p1': 'MANAGER'});
    await tester.pumpAndSettle();
    expect(find.byIcon(Icons.edit_outlined), findsWidgets);
  });

  testWidgets('a student has no Occupation row', (tester) async {
    await _pump(
      tester,
      fetch: () async => _app(
        extra: {
          'employer_type': 'STUDENT',
          'occupation': 'STUDENT',
          'employer': 'Legon',
        },
      ),
    );

    await _openTenantPage(tester);
    expect(find.text('Legon'), findsOneWidget);
    expect(find.text('Occupation'), findsNothing);
    expect(find.text('STUDENT'), findsNothing);
  });

  testWidgets('pull-to-refresh reloads my property roles', (tester) async {
    var builds = 0;
    await _pump(
      tester,
      fetch: () async => _app(),
      fetchRoles: () async {
        builds++;
        return const {'p1': 'MANAGER'};
      },
    );
    expect(builds, 1);

    await tester
        .widget<RefreshIndicator>(find.byType(RefreshIndicator))
        .onRefresh();
    await tester.pumpAndSettle();

    expect(builds, 2);
  });
}
