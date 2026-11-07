import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/modules/main/activity/application_detail.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/approve_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/shared/sheet_kit.dart';

const _unit = {
  'id': 'u1',
  'name': 'Unit 1C',
  'type': 'APARTMENT',
  'status': 'Unit.Status.Available',
  'rent_fee': 300000,
  'rent_fee_currency': 'GHS',
};

const _complete = {
  'desired_unit': _unit,
  'first_name': 'Ama',
  'last_name': 'Mensah',
  'phone': '+233200000000',
  'gender': 'FEMALE',
  'date_of_birth': '1990-01-01T00:00:00Z',
  'nationality': 'GH',
  'marital_status': 'SINGLE',
  'current_address': 'addr',
  'id_type': 'GHANA_CARD',
  'id_number': '1',
  'employer_type': 'WORKER',
  'occupation': 'o',
  'employer': 'emp',
  'occupation_address': 'oa',
  'emergency_contact_name': 'e',
  'emergency_contact_phone': '+233200000001',
  'relationship_to_emergency_contact': 'r',
  'desired_move_in_date': '2026-08-01T00:00:00Z',
  'stay_duration_frequency': 'MONTHLY',
  'stay_duration': 12,
  'rent_fee': 300000,
  'financial_account': {'id': 'fa', 'charge_count': 3},
};

TenantApplicationModel _app([Map<String, dynamic> extra = const {}]) =>
    TenantApplicationModel.fromJson({
      'id': 'a1',
      'code': 'APP-1',
      'status': 'TenantApplication.Status.InProgress',
      'property_id': 'p1',
      ...extra,
    });

class _FakeApprove extends ApproveApplicationNotifier {
  static final calls = <Map<String, String>>[];
  static String? failWith;
  static Completer<void>? hold;

  @override
  Future<void> submit({required String propertyId, required String id}) async {
    calls.add({'propertyId': propertyId, 'id': id});
    if (hold != null) {
      state = ApproveApplicationState(status: ApiStatus.pending);
      await hold!.future;
    }
    state = failWith == null
        ? ApproveApplicationState(
            status: ApiStatus.success,
            lease: ApprovedLeaseModel(
              id: 'l1',
              status: 'Lease.Status.Pending',
              tenantId: 't1',
            ),
          )
        : ApproveApplicationState(
            status: ApiStatus.failed,
            errorMessage: translateApiErrorMessage(errorMessage: failWith),
          );
  }
}

Future<List<String>> _pump(
  WidgetTester tester,
  TenantApplicationModel app, {
  String role = 'MANAGER',
}) async {
  tester.view.physicalSize = const Size(800, 2400);
  tester.view.devicePixelRatio = 2;
  addTearDown(tester.view.reset);
  final pushed = <String>[];
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, _) =>
            const ApplicationDetailScreen(id: 'a1', propertyId: 'p1'),
      ),
      GoRoute(
        path: '/more/leases/:id',
        builder: (_, s) {
          pushed.add(s.uri.toString());
          return const Scaffold(body: Text('lease page'));
        },
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async => app),
        myPropertyRolesProvider.overrideWith((ref) async => {'p1': role}),
        approveApplicationNotifierProvider.overrideWith(_FakeApprove.new),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
  return pushed;
}

void main() {
  setUp(() {
    _FakeApprove.calls.clear();
    _FakeApprove.failWith = null;
    _FakeApprove.hold = null;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  bool approveEnabled(WidgetTester tester) =>
      tester
          .widget<GestureDetector>(
            find
                .ancestor(
                  of: find.text('Approve & move in'),
                  matching: find.byType(GestureDetector),
                )
                .first,
          )
          .onTap !=
      null;

  testWidgets('STAFF never sees Approve', (tester) async {
    await _pump(tester, _app(_complete), role: 'STAFF');
    expect(find.text('Approve & move in'), findsNothing);
  });

  testWidgets('an incomplete checklist disables Approve and says why', (
    tester,
  ) async {
    await _pump(tester, _app());
    expect(find.text('Approve & move in'), findsOneWidget);
    expect(approveEnabled(tester), isFalse);
    expect(find.textContaining('Still to finish'), findsOneWidget);
    expect(find.textContaining('Select a unit'), findsWidgets);
  });

  testWidgets('an ONLINE document without a PDF is blocked on the web', (
    tester,
  ) async {
    await _pump(
      tester,
      _app({..._complete, 'lease_agreement_document_mode': 'ONLINE'}),
    );
    expect(approveEnabled(tester), isFalse);
    expect(
      find.text(
        'The lease document was written on the web. Approve this tenant on '
        'the web so it can be turned into a PDF.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('confirming approves and opens what is next with the lease', (
    tester,
  ) async {
    final pushed = await _pump(tester, _app(_complete));
    expect(approveEnabled(tester), isTrue);

    await tester.tap(find.text('Approve & move in'));
    await tester.pumpAndSettle();
    expect(find.text('Approve & move in Ama Mensah?'), findsOneWidget);
    expect(
      find.text(
        "This creates the lease for Unit 1C. You won't be able to edit this "
        'tenant setup afterwards.',
      ),
      findsOneWidget,
    );
    expect(
      find.text('No lease document is attached. You can add one on the web.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Approve & move in').last);
    await tester.pumpAndSettle();

    expect(_FakeApprove.calls, [
      {'propertyId': 'p1', 'id': 'a1'},
    ]);
    expect(find.text("What's next?"), findsOneWidget);
    expect(find.text('Visit tenant profile'), findsOneWidget);
    expect(find.text('Add another tenant'), findsOneWidget);
    expect(find.textContaining('inspection'), findsNothing);

    await tester.tap(find.text('Go to the lease'));
    await tester.pumpAndSettle();
    expect(pushed, ['/more/leases/l1?property_id=p1']);
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('a unit that was taken shows the translated message', (
    tester,
  ) async {
    _FakeApprove.failWith = 'UnitNoLongerAvailable';
    await _pump(tester, _app(_complete));

    await tester.tap(find.text('Approve & move in'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Approve & move in').last);
    await tester.pumpAndSettle();

    expect(
      find.text('That unit is no longer available. Pick another unit.'),
      findsOneWidget,
    );
    expect(find.text("What's next?"), findsNothing);
  });

  testWidgets('a completed setup offers only add another tenant', (
    tester,
  ) async {
    await _pump(
      tester,
      _app({..._complete, 'status': 'TenantApplication.Status.Completed'}),
    );
    await tester.tap(find.text("What's next?"));
    await tester.pumpAndSettle();
    expect(find.text('Go to the lease'), findsNothing);
    expect(find.text('Visit tenant profile'), findsNothing);
    expect(find.text('Add another tenant'), findsOneWidget);
  });

  testWidgets('the approve sheet cannot be dismissed while it saves', (
    tester,
  ) async {
    _FakeApprove.hold = Completer<void>();
    await _pump(tester, _app(_complete));

    await tester.tap(find.text('Approve & move in'));
    await tester.pumpAndSettle();
    expect(tester.widget<RLSheet>(find.byType(RLSheet)).dismissible, isTrue);

    await tester.tap(find.text('Approve & move in').last);
    await tester.pump();
    await tester.pump();
    expect(tester.widget<RLSheet>(find.byType(RLSheet)).dismissible, isFalse);

    await tester.tapAt(const Offset(10, 10));
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('Approve & move in Ama Mensah?'), findsOneWidget);

    _FakeApprove.hold!.complete();
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 5));
  });
}
