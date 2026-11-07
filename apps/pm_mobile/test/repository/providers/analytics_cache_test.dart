import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:rentloop_manager/src/api/analytics_api.dart';
import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/property_api.dart' show PropertiesPage;
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/money/root.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/options/property_options_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';
import 'package:rentloop_manager/src/repository/providers/analytics_token_provider.dart';
import 'package:rentloop_manager/src/repository/providers/home/home_stats_provider.dart';

import '../../support/options_fakes.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

String _jwt(DateTime exp) {
  String enc(Object o) =>
      base64Url.encode(utf8.encode(jsonEncode(o))).replaceAll('=', '');
  return '${enc({'alg': 'none'})}.${enc({'exp': exp.millisecondsSinceEpoch ~/ 1000})}.sig';
}

class _FakeAnalytics extends AnalyticsApi {
  _FakeAnalytics(this.mint) : super(tokenManager: TokenManager(_NoStorage()));

  final String Function(int call) mint;
  final clients = <String>[];

  @override
  Future<String> getToken({required String clientId}) async {
    clients.add(clientId);
    return mint(clients.length);
  }
}

class _GatedAnalytics extends AnalyticsApi {
  _GatedAnalytics(this.respond)
    : super(tokenManager: TokenManager(_NoStorage()));

  final Future<String> Function(String clientId, int call) respond;
  int calls = 0;

  @override
  Future<String> getToken({required String clientId}) =>
      respond(clientId, ++calls);
}

class _FakeCube extends CubeApi {
  final tokens = <String>[];
  final queries = <Map<String, dynamic>>[];
  bool Function(String token)? reject;

  @override
  Future<List<Map<String, dynamic>>> load({
    required String token,
    required Map<String, dynamic> query,
  }) async {
    tokens.add(token);
    queries.add(query);
    if (reject?.call(token) ?? false) {
      throw CubeException(401, '{"error":"expired"}');
    }
    return [{}];
  }
}

class _Workspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => _cu('c1');

  void switchTo(ClientUserModel cu) => state = cu;
}

ClientUserModel _cu(String clientId) => ClientUserModel(
  id: 'cu',
  clientId: clientId,
  role: 'OWNER',
  status: 'ACTIVE',
);

ProviderContainer _container(AnalyticsApi analytics, _FakeCube cube) =>
    ProviderContainer(
      overrides: [
        currentWorkspaceNotifierProvider.overrideWith(_Workspace.new),
        analyticsApiProvider.overrideWithValue(analytics),
        cubeApiProvider.overrideWithValue(cube),
      ],
    );

String _validToken(int call) =>
    _jwt(DateTime.now().add(const Duration(hours: 1)));

void main() {
  test('a failed token fetch is retried on the next refresh', () async {
    var fail = true;
    final analytics = _FakeAnalytics((_) {
      if (fail) throw Exception('offline');
      return _validToken(1);
    });
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);

    await expectLater(
      container.read(homeChargesProvider(null).future),
      throwsA(anything),
    );
    fail = false;
    container.invalidate(homeChargesProvider);
    await container.read(homeChargesProvider(null).future);

    expect(analytics.clients.length, lessThanOrEqualTo(3));
  });

  test('token fetched once across Home slices + activityCounts', () async {
    final analytics = _FakeAnalytics(_validToken);
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);

    await Future.wait([
      container.read(homeChargesProvider(null).future),
      container.read(homePaymentsProvider(null).future),
      container.read(homeUnitsProvider('p1').future),
    ]);
    await container.read(activityCountsProvider.future);

    expect(analytics.clients, ['c1']);
  });

  test('Home slices are cached across re-reads until invalidated', () async {
    final cube = _FakeCube();
    final container = _container(_FakeAnalytics(_validToken), cube);
    addTearDown(container.dispose);

    var sub = container.listen(homeChargesProvider(null), (_, __) {});
    await container.read(homeChargesProvider(null).future);
    sub.close();
    sub = container.listen(homeChargesProvider(null), (_, __) {});
    await container.read(homeChargesProvider(null).future);
    await container.read(homeChargesProvider('p1').future);
    expect(cube.queries, hasLength(2));

    for (final p in homeStatsProviders) {
      container.invalidate(p);
    }
    await container.read(homeChargesProvider(null).future);
    await container.read(homeChargesProvider('p1').future);
    expect(cube.queries, hasLength(4));
    sub.close();
  });

  test('expired token is refreshed', () async {
    final analytics = _FakeAnalytics(
      (call) => call == 1
          ? _jwt(DateTime.now().subtract(const Duration(minutes: 1)))
          : _jwt(DateTime.now().add(const Duration(hours: 1))),
    );
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);

    final notifier = container.read(analyticsTokenNotifierProvider.notifier);
    await container.read(analyticsTokenNotifierProvider.future);
    await notifier.fresh();

    expect(analytics.clients, hasLength(2));
  });

  test('token within 60s of exp is refreshed, further out is kept', () async {
    final analytics = _FakeAnalytics(
      (call) => call == 1
          ? _jwt(DateTime.now().add(const Duration(seconds: 30)))
          : _jwt(DateTime.now().add(const Duration(hours: 1))),
    );
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);

    final notifier = container.read(analyticsTokenNotifierProvider.notifier);
    await container.read(analyticsTokenNotifierProvider.future);
    await notifier.fresh();
    await notifier.fresh();

    expect(analytics.clients, hasLength(2));
  });

  test('an undecodable token is trusted for five minutes', () async {
    final analytics = _FakeAnalytics((_) => 'not-a-jwt');
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);

    final notifier = container.read(analyticsTokenNotifierProvider.notifier);
    await container.read(analyticsTokenNotifierProvider.future);
    expect(await notifier.fresh(), 'not-a-jwt');

    expect(analytics.clients, hasLength(1));
  });

  test('cube 401 refreshes the token and retries once', () async {
    final analytics = _FakeAnalytics(
      (call) => call == 1
          ? _jwt(DateTime.now().add(const Duration(hours: 1)))
          : _jwt(DateTime.now().add(const Duration(hours: 2))),
    );
    final cube = _FakeCube();
    final first = _jwt(DateTime.now().add(const Duration(hours: 1)));
    cube.reject = (t) =>
        t.length == first.length && analytics.clients.length == 1;
    final container = _container(analytics, cube);
    addTearDown(container.dispose);

    await container.read(homeChargesProvider(null).future);

    expect(analytics.clients, hasLength(2));
  });

  test('a persistent cube 401 fails after one retry', () async {
    final analytics = _FakeAnalytics(_validToken);
    final cube = _FakeCube()..reject = (_) => true;
    final container = _container(analytics, cube);
    addTearDown(container.dispose);

    await expectLater(
      container.read(homeChargesProvider(null).future),
      throwsA(isA<Exception>()),
    );
    expect(analytics.clients, hasLength(2));
  });

  test('switching workspace refetches Home slices', () async {
    final analytics = _FakeAnalytics(_validToken);
    final cube = _FakeCube();
    final container = _container(analytics, cube);
    addTearDown(container.dispose);
    container.listen(homeLeasesProvider(null), (_, __) {});

    final first = await container.read(homeLeasesProvider(null).future);
    expect(first.clientId, 'c1');

    (container.read(currentWorkspaceNotifierProvider.notifier) as _Workspace)
        .switchTo(_cu('c2'));
    final second = await container.read(homeLeasesProvider(null).future);

    expect(second.clientId, 'c2');
    expect(analytics.clients, ['c1', 'c2']);
  });

  test('a refresh started before a workspace switch never commits', () async {
    final gate = Completer<String>();
    final analytics = _GatedAnalytics((clientId, call) {
      if (call == 2) return gate.future;
      return Future.value(_jwt(DateTime.now().add(const Duration(minutes: 5))));
    });
    final container = _container(analytics, _FakeCube());
    addTearDown(container.dispose);
    container.listen(analyticsTokenNotifierProvider, (_, __) {});
    final notifier = container.read(analyticsTokenNotifierProvider.notifier);
    await container.read(analyticsTokenNotifierProvider.future);

    notifier.expire();
    final stale = notifier.fresh();
    await Future<void>.delayed(Duration.zero);

    (container.read(currentWorkspaceNotifierProvider.notifier) as _Workspace)
        .switchTo(_cu('c2'));
    final tokenB = await container.read(analyticsTokenNotifierProvider.future);
    gate.complete(_jwt(DateTime.now().add(const Duration(hours: 9))));
    await stale;
    await Future<void>.delayed(Duration.zero);

    expect(await notifier.fresh(), tokenB);
    expect(container.read(analyticsTokenNotifierProvider).value, tokenB);
  });

  testWidgets('switching workspace resets the Rent tab property filter', (
    tester,
  ) async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
    final router = GoRouter(
      routes: [GoRoute(path: '/', builder: (_, __) => const MoneyScreen())],
    );
    addTearDown(router.dispose);
    final container = ProviderContainer(
      overrides: [
        currentWorkspaceNotifierProvider.overrideWith(_Workspace.new),
        clientUserPropertyApiProvider.overrideWithValue(_PerWorkspaceApi()),
        for (final view in BillsView.values)
          for (final id in <String?>[null, 'a1'])
            billsNotifierProvider(view, id).overrideWith(_StubBills.new),
      ],
    );
    addTearDown(container.dispose);
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Property: All properties'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('A1'));
    await tester.pumpAndSettle();
    expect(find.text('Property: A1'), findsOneWidget);

    (container.read(currentWorkspaceNotifierProvider.notifier) as _Workspace)
        .switchTo(_cu('c2'));
    await tester.pumpAndSettle();

    expect(find.text('Property: A1'), findsNothing);
    await tester.tap(find.text('Property: All properties'));
    await tester.pumpAndSettle();
    expect(find.text('B1'), findsOneWidget);
    expect(find.text('A2'), findsNothing);
  });

  testWidgets('pull-to-refresh on Rent tab no longer refetches roles', (
    tester,
  ) async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
    final roles = _CountingRolesApi();
    final router = GoRouter(
      routes: [GoRoute(path: '/', builder: (_, __) => const MoneyScreen())],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          currentWorkspaceNotifierProvider.overrideWith(_Workspace.new),
          clientUserPropertyApiProvider.overrideWithValue(roles),
          billsNotifierProvider(
            BillsView.owing,
            null,
          ).overrideWith(_StubBills.new),
          propertyOptionsNotifierProvider().overrideWith(
            () => FakePropertyOptions(const []),
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pump();
    await tester.pump();
    final before = roles.calls;
    expect(before, 1);

    await tester.timedDrag(
      find.byType(Scrollable).first,
      const Offset(0, 400),
      const Duration(milliseconds: 500),
    );
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(roles.calls, before);
  });
}

class _CountingRolesApi extends ClientUserPropertyApi {
  _CountingRolesApi() : super(tokenManager: TokenManager(_NoStorage()));

  int calls = 0;

  @override
  Future<Map<String, String>> getMyPropertyRoles({
    required String clientId,
  }) async {
    calls++;
    return {'p1': 'MANAGER'};
  }
}

class _PerWorkspaceApi extends ClientUserPropertyApi {
  _PerWorkspaceApi() : super(tokenManager: TokenManager(_NoStorage()));

  @override
  Future<Map<String, String>> getMyPropertyRoles({
    required String clientId,
  }) async => {};

  @override
  Future<PropertiesPage> getMyProperties({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? order,
    String? orderBy,
  }) async {
    final names = clientId == 'c1' ? ['A1', 'A2'] : ['B1', 'B2'];
    return PropertiesPage(
      rows: [
        for (final n in names)
          PropertyModel(
            id: n.toLowerCase(),
            name: n,
            type: 'Property.Type.Apartment',
            status: 'Property.Status.Active',
          ),
      ],
      meta: PaginationMetaModel(
        total: 2,
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
}

class _StubBills extends BillsNotifier {
  @override
  BillsState build(BillsView view, String? propertyId, {bool picker = false}) =>
      const BillsState(hasLoaded: true);

  @override
  Future<void> loadFirstPage({String? search}) async {}
}
