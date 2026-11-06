import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/property_stats_logic.dart';
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
    if (measures.contains('Payments.totalAmount')) {
      return [
        {'Payments.totalAmount': '450000'},
      ];
    }
    if (measures.contains('Charges.outstandingAmount')) {
      return [
        {
          'Charges.outstandingAmount': '1200000',
          'Charges.arrearsAmount': '300000',
        },
      ];
    }
    return [
      {'Units.availableCount': '3', 'Units.count': '12'},
    ];
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

void main() {
  test('homeStats sends the three unfiltered cube queries', () async {
    final cube = _FakeCube();
    final container = _container(cube);
    addTearDown(container.dispose);

    final stats = await container.read(homeStatsProvider.future);

    expect(stats.collectedThisMonth, 450000);
    expect(stats.stillToCollect, 1200000);
    expect(stats.late, 300000);
    expect(stats.emptyUnits, 3);
    expect(stats.totalUnits, 12);

    expect(cube.queries, hasLength(3));
    final byMeasure = {
      for (final q in cube.queries) (q['measures'] as List).first: q,
    };
    final payments = byMeasure['Payments.totalAmount']!;
    expect(payments['measures'], ['Payments.totalAmount']);
    final range = (payments['timeDimensions'] as List).single as Map;
    expect(range['dimension'], 'Payments.successfulAt');
    expect(range['dateRange'], currentMonthDateRange(DateTime.now()));
    final charges = byMeasure['Charges.outstandingAmount']!;
    expect(charges['measures'], [
      'Charges.outstandingAmount',
      'Charges.arrearsAmount',
    ]);
    expect(charges['dimensions'], ['Charges.financialAccountId']);
    expect(byMeasure['Units.availableCount']!['measures'], [
      'Units.availableCount',
      'Units.count',
    ]);
    for (final q in cube.queries) {
      expect(q.containsKey('filters'), isFalse);
    }
  });

  test('a cube failure surfaces as a translated Exception', () async {
    final container = _container(_FakeCube(fail: true));
    addTearDown(container.dispose);

    await expectLater(
      container.read(homeStatsProvider.future),
      throwsA(isA<Exception>()),
    );
  });
}
