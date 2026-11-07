import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/modules/main/tenants/detail.dart';
import 'package:rentloop_manager/src/modules/main/tenants/root.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/tenants/tenants_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/leases/lease_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/tenant_detail_provider.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

TenantModel _tenant({
  TenantLeaseRef? lease,
  bool withLease = true,
  String? email,
}) => TenantModel(
  id: 't1',
  firstName: 'Ama',
  lastName: 'Boateng',
  phone: '024 455 1190',
  gender: 'FEMALE',
  email: email,
  recentLease: withLease
      ? (lease ??
            TenantLeaseRef(
              id: 'l1',
              status: 'Lease.Status.Active',
              unit: UnitModel(
                id: 'u1',
                name: 'Unit 4B',
                type: 'APARTMENT',
                status: 'Unit.Status.Occupied',
                rentFee: 100000,
                rentFeeCurrency: 'GHS',
                propertyId: 'p1',
                property: UnitPropertyRef(id: 'p1', name: 'Cantonments Court'),
              ),
              rentFee: 120000,
              rentFeeCurrency: 'GHS',
              paymentFrequency: 'MONTHLY',
              moveInDate: '2025-01-05T00:00:00Z',
              moveOutDate: '2026-01-04T00:00:00Z',
            ))
      : null,
);

LeaseModel _lease(LeaseFinancialRef? fin) => LeaseModel(
  id: 'l1',
  code: 'LS-1',
  status: 'Lease.Status.Active',
  unitId: 'u1',
  tenantId: 't1',
  rentFee: 120000,
  rentFeeCurrency: 'GHS',
  financialAccount: fin,
);

LeaseFinancialRef _fin(int outstanding) => LeaseFinancialRef(
  id: 'f1',
  currency: 'GHS',
  outstandingAmount: outstanding,
);

Future<GoRouter> _pump(
  WidgetTester tester, {
  String? propertyId = 'p1',
  Future<TenantModel> Function()? tenant,
  Future<LeaseModel> Function()? lease,
}) async {
  tester.view.physicalSize = const Size(800, 4000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) =>
            TenantDetailScreen(id: 't1', propertyId: propertyId),
      ),
      GoRoute(
        path: '/more/leases/:id',
        builder: (_, s) => Text(
          'LEASE ${s.pathParameters['id']} ${s.uri.queryParameters['property_id']}',
        ),
      ),
    ],
  );
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        tenantDetailProvider('p1', 't1').overrideWith(
          (ref) => tenant != null ? tenant() : Future.value(_tenant()),
        ),
        leaseDetailProvider('p1', 'l1').overrideWith(
          (ref) => lease != null ? lease() : Future.value(_lease(_fin(45000))),
        ),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
  return router;
}

void main() {
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('shows name, unit, contact buttons and what they owe', (
    tester,
  ) async {
    await _pump(tester);
    expect(find.text('Ama Boateng'), findsOneWidget);
    expect(find.text('Unit 4B · Cantonments Court'), findsOneWidget);
    expect(find.text('Ama owes you'), findsOneWidget);
    expect(find.text('GH₵ 450.00'), findsOneWidget);
    expect(find.text('Call'), findsOneWidget);
    expect(find.text('WhatsApp'), findsOneWidget);
    expect(find.text('Moved in'), findsOneWidget);
    expect(find.text('5 Jan 2025'), findsOneWidget);
    expect(find.text('Lease ends'), findsOneWidget);
    expect(find.text('See lease'), findsOneWidget);
    expect(find.text('Not added'), findsOneWidget);
  });

  testWidgets('credit reads "You owe Ama"', (tester) async {
    await _pump(tester, lease: () async => _lease(_fin(-5000)));
    expect(find.text('You owe Ama'), findsOneWidget);
    expect(find.text('GH₵ 50.00'), findsOneWidget);
  });

  testWidgets('zero reads "All paid up"', (tester) async {
    await _pump(tester, lease: () async => _lease(_fin(0)));
    expect(find.text('All paid up'), findsOneWidget);
    expect(find.text('GH₵ 0.00'), findsOneWidget);
  });

  testWidgets('no money set up reads "Rent not set up yet"', (tester) async {
    await _pump(tester, lease: () async => _lease(null));
    expect(find.text('Rent not set up yet'), findsOneWidget);
  });

  testWidgets('no lease hides the Lease section and shows not set up', (
    tester,
  ) async {
    await _pump(tester, tenant: () async => _tenant(withLease: false));
    expect(find.text('Rent not set up yet'), findsOneWidget);
    expect(find.text('LEASE'), findsNothing);
    expect(find.text('See lease'), findsNothing);
  });

  testWidgets('lease with no id keeps the section but hides See lease', (
    tester,
  ) async {
    await _pump(
      tester,
      tenant: () async => _tenant(
        lease: TenantLeaseRef(
          status: 'Lease.Status.Active',
          rentFee: 1000,
          rentFeeCurrency: 'GHS',
        ),
      ),
    );
    expect(find.text('Rent not set up yet'), findsOneWidget);
    expect(find.text('LEASE'), findsOneWidget);
    expect(find.text('See lease'), findsNothing);
  });

  testWidgets('lease read failing keeps the tenant', (tester) async {
    await _pump(tester, lease: () => Future.error(Exception('boom')));
    expect(find.text('Ama Boateng'), findsOneWidget);
    expect(find.text("Couldn't load what they owe."), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('missing property_id reads nothing', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final observer = _AddedObserver();
    await tester.pumpWidget(
      ProviderScope(
        observers: [observer],
        child: const MaterialApp(
          home: TenantDetailScreen(id: 't1', propertyId: null),
        ),
      ),
    );
    await tester.pump();
    expect(find.text("We couldn't open this tenant."), findsOneWidget);
    expect(find.text('Try again'), findsNothing);
    expect(observer.names.where((n) => n.contains('Detail')), isEmpty);
  });

  testWidgets('empty property_id reads nothing', (tester) async {
    final observer = _AddedObserver();
    await tester.pumpWidget(
      ProviderScope(
        observers: [observer],
        child: const MaterialApp(
          home: TenantDetailScreen(id: 't1', propertyId: ''),
        ),
      ),
    );
    await tester.pump();
    expect(find.text("We couldn't open this tenant."), findsOneWidget);
    expect(observer.names.where((n) => n.contains('Detail')), isEmpty);
  });

  testWidgets('owes card Try again re-reads the lease', (tester) async {
    var reads = 0;
    await _pump(
      tester,
      lease: () {
        reads++;
        return Future.error(Exception('boom'));
      },
    );
    expect(reads, 1);
    await tester.tap(find.text('Try again'));
    await tester.pump();
    await tester.pump();
    expect(reads, 2);
  });

  testWidgets('pending lease reads "Moves in"', (tester) async {
    await _pump(
      tester,
      tenant: () async => _tenant(
        lease: TenantLeaseRef(
          id: 'l1',
          status: 'Lease.Status.Pending',
          rentFee: 1000,
          rentFeeCurrency: 'GHS',
          moveInDate: '2030-01-05T00:00:00Z',
        ),
      ),
    );
    expect(find.text('Moves in'), findsOneWidget);
    expect(find.text('Moved in'), findsNothing);
  });

  testWidgets('shows a shimmer before the tenant loads', (tester) async {
    final c = Completer<TenantModel>();
    await _pump(tester, tenant: () => c.future);
    expect(find.text('Kwame Mensah'), findsNothing);
    expect(find.text('Ama Boateng'), findsNothing);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    c.complete(_tenant());
    await tester.pump();
    await tester.pump();
    expect(find.text('Ama Boateng'), findsOneWidget);
  });

  testWidgets('tenant read failing shows a retry', (tester) async {
    await _pump(tester, tenant: () => Future.error(Exception('boom')));
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('See lease pushes /more/leases/l1?property_id=p1', (
    tester,
  ) async {
    await _pump(tester);
    await tester.tap(find.text('See lease'));
    await tester.pumpAndSettle();
    expect(find.text('LEASE l1 p1'), findsOneWidget);
  });

  testWidgets('tenants list row pushes the property id', (tester) async {
    _StubNotifier.items = [_tenant()];
    final router = GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, __) => const TenantsScreen()),
        GoRoute(
          path: '/more/tenants/:id',
          builder: (_, s) => Text(
            'DETAIL ${s.pathParameters['id']} ${s.uri.queryParameters['property_id']}',
          ),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tenantsNotifierProvider(null).overrideWith(_StubNotifier.new),
          pendingTenantsProvider(null).overrideWith(
            (ref) async => TenantApplicationsPage(
              rows: const [],
              meta: PaginationMetaModel(
                total: 0,
                page: 1,
                pageSize: 20,
                hasNextPage: false,
                hasPreviousPage: false,
              ),
            ),
          ),
          myPropertyRolesProvider.overrideWith((ref) async => {}),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();
    await tester.pump();
    await tester.tap(find.text('Ama Boateng'));
    await tester.pumpAndSettle();
    expect(find.text('DETAIL t1 p1'), findsOneWidget);
  });
}

class _StubNotifier extends TenantsNotifier {
  static List<TenantModel> items = const [];

  @override
  TenantsState build(String? propertyId) =>
      TenantsState(items: items, total: items.length);

  @override
  Future<void> loadFirstPage([
    TenantsQuery query = const TenantsQuery(),
  ]) async {}
}

class _AddedObserver extends ProviderObserver {
  final names = <String>[];

  @override
  void didAddProvider(
    ProviderBase<Object?> provider,
    Object? value,
    ProviderContainer container,
  ) {
    names.add('${provider.name ?? provider.runtimeType}');
  }
}
