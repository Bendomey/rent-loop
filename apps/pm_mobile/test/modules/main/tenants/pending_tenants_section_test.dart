import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/modules/main/tenants/root.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/tenants/tenants_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _StubTenantsNotifier extends TenantsNotifier {
  static List<TenantModel> items = const [];

  @override
  TenantsState build(String? propertyId) =>
      TenantsState(items: items, total: items.length);

  @override
  Future<void> loadFirstPage([
    TenantsQuery query = const TenantsQuery(),
  ]) async {}
}

TenantModel _tenant(int i) => TenantModel(
  id: 't$i',
  firstName: 'Tenant',
  lastName: '$i',
  phone: '+23324000000$i',
  gender: 'MALE',
);

TenantApplicationsPage _page(List<TenantApplicationModel> rows, {int? total}) =>
    TenantApplicationsPage(
      rows: rows,
      meta: PaginationMetaModel(
        total: total ?? rows.length,
        page: 1,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );

class _SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

class _RecordingApi extends TenantApplicationApi {
  _RecordingApi() : super(tokenManager: TokenManager(_NoStorage()));

  Map<String, dynamic>? args;

  @override
  Future<TenantApplicationsPage> getTenantApplications({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? statusLabel,
    String? gender,
    String? maritalStatus,
    List<String> propertyIds = const [],
    List<String> desiredUnitIds = const [],
    String? search,
    String orderBy = 'created_at',
  }) async {
    args = {
      'status': statusLabel,
      'page_size': pageSize,
      'property_ids': propertyIds,
      'order_by': orderBy,
    };
    return TenantApplicationsPage(
      rows: [TenantApplicationModel(id: 'a1', code: 'TA-1')],
      meta: PaginationMetaModel(
        total: 1,
        page: 1,
        pageSize: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
}

Future<void> _pump(
  WidgetTester tester,
  List<TenantApplicationModel> pending, {
  int? total,
  Future<Map<String, String>> Function()? roles,
}) async {
  final router = GoRouter(
    routes: [GoRoute(path: '/', builder: (_, __) => const TenantsScreen())],
  );
  addTearDown(router.dispose);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        tenantsNotifierProvider(null).overrideWith(_StubTenantsNotifier.new),
        pendingTenantsProvider(
          null,
        ).overrideWith((ref) async => _page(pending, total: total)),
        if (roles != null)
          myPropertyRolesProvider.overrideWith((ref) => roles()),
      ],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pump();
  await tester.pump();
}

void main() {
  setUp(() {
    _StubTenantsNotifier.items = const [];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('haptic_feedback'),
          (_) async => null,
        );
  });

  testWidgets('the pending count is the server total, not the page size', (
    tester,
  ) async {
    await _pump(tester, [
      TenantApplicationModel(id: 'a1', code: 'TA-1', firstName: 'Ama'),
    ], total: 73);

    expect(find.text('Pending tenants · 73'), findsOneWidget);
  });

  testWidgets('the Add tenant button leaves the last tenant uncovered', (
    tester,
  ) async {
    _StubTenantsNotifier.items = [for (var i = 0; i < 20; i++) _tenant(i)];
    await _pump(tester, const []);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -10000));
    await tester.pumpAndSettle();

    final lastRow = tester.getRect(find.text('Tenant 19'));
    final fab = tester.getRect(find.byType(FloatingActionButton));
    expect(lastRow.bottom, lessThan(fab.top));
  });

  testWidgets('pull-to-refresh leaves my property roles alone', (tester) async {
    var builds = 0;
    await _pump(
      tester,
      const [],
      roles: () async {
        builds++;
        return const {'p1': 'MANAGER'};
      },
    );
    final container = ProviderScope.containerOf(
      tester.element(find.byType(TenantsScreen)),
    );
    await container.read(myPropertyRolesProvider.future);
    expect(builds, 1);

    await tester
        .widget<RefreshIndicator>(find.byType(RefreshIndicator))
        .onRefresh();
    await container.read(myPropertyRolesProvider.future);

    expect(builds, 1);
  });

  testWidgets('shows pending tenants, active header and Add tenant', (
    tester,
  ) async {
    await _pump(tester, [
      TenantApplicationModel(id: 'a1', code: 'TA-1', firstName: 'Ama'),
      TenantApplicationModel(id: 'a2', code: 'TA-2'),
    ]);

    expect(find.text('Pending tenants · 2'), findsOneWidget);
    expect(find.textContaining('Ama'), findsOneWidget);
    expect(find.text('No name yet'), findsOneWidget);
    expect(find.text('Active tenants'), findsOneWidget);
    expect(find.text('Add tenant'), findsOneWidget);
  });

  testWidgets('hides the section when there are none', (tester) async {
    await _pump(tester, const []);

    expect(find.textContaining('Pending tenants'), findsNothing);
    expect(find.text('Add tenant'), findsOneWidget);
  });

  test('pendingTenants asks for in-progress applications', () async {
    final api = _RecordingApi();
    final container = ProviderContainer(
      overrides: [
        tenantApplicationApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
      ],
    );
    addTearDown(container.dispose);

    final page = await container.read(pendingTenantsProvider('p1').future);

    expect(page.rows, hasLength(1));
    expect(page.meta.total, 1);
    expect(api.args, {
      'status': 'In Progress',
      'page_size': 50,
      'property_ids': ['p1'],
      'order_by': 'tenant_applications.created_at',
    });
  });
}
