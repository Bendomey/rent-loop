import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/home_stats_logic.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _FakeAnalytics extends AnalyticsApi {
  _FakeAnalytics() : super(tokenManager: TokenManager(_NoStorage()));

  @override
  Future<String> getToken({required String clientId}) async => 'tok';
}

class _FakeCube extends CubeApi {
  _FakeCube({this.fail = false});

  final bool fail;
  final queries = <Map<String, dynamic>>[];

  @override
  Future<List<Map<String, dynamic>>> load({
    required String token,
    required Map<String, dynamic> query,
  }) async {
    queries.add(query);
    if (fail) throw CubeException(500, '{"error":"boom"}');
    final measures = (query['measures'] as List).cast<String>();
    final month = homeTrendDateRange(DateTime.now()).last.substring(0, 7);
    return switch (measures.first.split('.').first) {
      'Payments' => [
        {
          'Payments.successfulAt.month': '$month-01T00:00:00.000',
          'Payments.propertyId': 'p1',
          'Payments.totalAmount': '450000',
        },
      ],
      'Charges' => [
        {
          'Charges.financialAccountId': 'fa1',
          'Charges.propertyId': 'p1',
          'Charges.outstandingAmount': '1200000',
          'Charges.arrearsAmount': '300000',
        },
      ],
      'Leases' => [
        {'Leases.activeCount': '4', 'Leases.expiringCount': '2'},
      ],
      'MaintenanceRequests' => [
        {
          'MaintenanceRequests.priority': 'EMERGENCY',
          'MaintenanceRequests.newCount': '1',
        },
        {
          'MaintenanceRequests.priority': 'LOW',
          'MaintenanceRequests.inProgressCount': '2',
        },
      ],
      'Units' => [
        {
          'Units.count': '12',
          'Units.occupiedCount': '9',
          'Units.availableCount': '3',
        },
      ],
      _ => [
        {'TenantApplications.inProgressCount': '5'},
      ],
    };
  }
}

class _SignedIn extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

ProviderContainer _container(_FakeCube cube) => ProviderContainer(
  overrides: [
    currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
    analyticsApiProvider.overrideWithValue(_FakeAnalytics()),
    cubeApiProvider.overrideWithValue(cube),
  ],
);

Future<void> _readAll(ProviderContainer c, String? id) => Future.wait([
  c.read(homePaymentsProvider(id).future),
  c.read(homeChargesProvider(id).future),
  c.read(homeLeasesProvider(id).future),
  c.read(homeRepairsProvider(id).future),
  c.read(homeUnitsProvider(id).future),
  c.read(homePendingTenantsProvider(id).future),
]);

void main() {
  test('each slice parses its cube and stamps the workspace', () async {
    final container = _container(_FakeCube());
    addTearDown(container.dispose);

    final payments = await container.read(homePaymentsProvider(null).future);
    final charges = await container.read(homeChargesProvider(null).future);
    final leases = await container.read(homeLeasesProvider(null).future);
    final repairs = await container.read(homeRepairsProvider(null).future);
    final units = await container.read(homeUnitsProvider(null).future);
    final pending = await container.read(
      homePendingTenantsProvider(null).future,
    );

    expect(payments.thisMonth, 450000);
    expect(payments.thisMonthByProperty, {'p1': 450000});
    expect(charges.stillToCollect, 1200000);
    expect(charges.late, 300000);
    expect(charges.lateProperties, 1);
    expect(leases.expiring, 2);
    expect(leases.active, 4);
    expect(repairs.open, 3);
    expect(repairs.urgent, 1);
    expect(units.occupiedPercent, 75);
    expect(pending.count, 5);
    for (final s in [payments, charges, leases, repairs, units, pending]) {
      expect(s.clientId, 'c1');
    }
  });

  test('All properties: one query per cube, no property filter', () async {
    final cube = _FakeCube();
    final container = _container(cube);
    addTearDown(container.dispose);

    await _readAll(container, null);

    expect(cube.queries, hasLength(6));
    for (final q in cube.queries) {
      expect(q['filters'], isEmpty);
    }
    final byCube = {
      for (final q in cube.queries)
        ((q['measures'] as List).first as String).split('.').first: q,
    };
    final payments = byCube['Payments']!;
    expect(payments['measures'], ['Payments.totalAmount']);
    expect(payments['dimensions'], ['Payments.propertyId']);
    final range = (payments['timeDimensions'] as List).single as Map;
    expect(range['dimension'], 'Payments.successfulAt');
    expect(range['granularity'], 'month');
    expect(range['dateRange'], homeTrendDateRange(DateTime.now()));
    expect(byCube['Charges']!['measures'], [
      'Charges.outstandingAmount',
      'Charges.arrearsAmount',
    ]);
    expect(byCube['Charges']!['dimensions'], [
      'Charges.financialAccountId',
      'Charges.propertyId',
    ]);
    expect(byCube['Leases']!['measures'], [
      'Leases.activeCount',
      'Leases.expiringCount',
    ]);
    expect(byCube['MaintenanceRequests']!['dimensions'], [
      'MaintenanceRequests.priority',
    ]);
    expect(byCube['Units']!['measures'], [
      'Units.count',
      'Units.occupiedCount',
      'Units.availableCount',
    ]);
    expect(byCube['TenantApplications']!['measures'], [
      'TenantApplications.inProgressCount',
    ]);
  });

  test('a chosen property filters every cube on its own property id', () async {
    final cube = _FakeCube();
    final container = _container(cube);
    addTearDown(container.dispose);

    await _readAll(container, 'p9');

    final members = {
      for (final q in cube.queries)
        for (final f in (q['filters'] as List).cast<Map>())
          f['member']: '${f['operator']} ${f['values']}',
    };
    expect(members, {
      'Payments.propertyId': 'equals [p9]',
      'Charges.propertyId': 'equals [p9]',
      'Leases.propertyId': 'equals [p9]',
      'MaintenanceRequests.propertyId': 'equals [p9]',
      'Units.propertyId': 'equals [p9]',
      'TenantApplications.propertyId': 'equals [p9]',
    });
  });

  test('a property is its own cache key', () async {
    final cube = _FakeCube();
    final container = _container(cube);
    addTearDown(container.dispose);

    await container.read(homePaymentsProvider(null).future);
    await container.read(homePaymentsProvider('p1').future);
    await container.read(homePaymentsProvider(null).future);

    expect(cube.queries, hasLength(2));
  });

  test('a cube failure surfaces as a translated Exception', () async {
    final container = _container(_FakeCube(fail: true));
    addTearDown(container.dispose);

    await expectLater(
      container.read(homeChargesProvider(null).future),
      throwsA(isA<Exception>()),
    );
  });

  test('the property choice resets on a workspace switch', () async {
    final container = ProviderContainer(
      overrides: [
        currentWorkspaceNotifierProvider.overrideWith(_Switchable.new),
      ],
    );
    addTearDown(container.dispose);
    container.listen(homePropertyProvider, (_, __) {});

    container.read(homePropertyProvider.notifier).select((
      id: 'p1',
      name: 'Ama Court',
    ));
    expect(container.read(homePropertyProvider)?.id, 'p1');

    (container.read(currentWorkspaceNotifierProvider.notifier) as _Switchable)
        .switchTo('c2');
    expect(container.read(homePropertyProvider), isNull);
  });
}

class _Switchable extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );

  void switchTo(String clientId) => state = ClientUserModel(
    id: 'cu',
    clientId: clientId,
    role: 'OWNER',
    status: 'ACTIVE',
  );
}
