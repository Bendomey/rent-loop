import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/tenant_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/tenants/tenants_notifier.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _FakeTenantApi extends TenantApi {
  _FakeTenantApi() : super(tokenManager: TokenManager(_NoStorage()));

  @override
  Future<TenantsPage> getTenants({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? propertyId,
  }) async {
    return TenantsPage(
      rows: const [],
      meta: PaginationMetaModel(
        total: propertyId == null ? 12 : 3,
        page: page,
        pageSize: pageSize,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
}

class _SignedInWorkspace extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => ClientUserModel(
    id: 'cu1',
    clientId: 'c1',
    role: 'OWNER',
    status: 'ACTIVE',
  );
}

void main() {
  test(
    'a property-filtered tenants list leaves the unfiltered list alone',
    () async {
      final container = ProviderContainer(
        overrides: [
          tenantApiProvider.overrideWithValue(_FakeTenantApi()),
          currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
        ],
      );
      addTearDown(container.dispose);
      final allSub = container.listen(
        tenantsNotifierProvider(null),
        (_, __) {},
      );
      final propertySub = container.listen(
        tenantsNotifierProvider('p1'),
        (_, __) {},
      );
      addTearDown(allSub.close);
      addTearDown(propertySub.close);

      await container
          .read(tenantsNotifierProvider(null).notifier)
          .loadFirstPage(const TenantsQuery());
      await container
          .read(tenantsNotifierProvider('p1').notifier)
          .loadFirstPage(const TenantsQuery(propertyId: 'p1'));

      expect(container.read(tenantsNotifierProvider(null)).total, 12);
      expect(container.read(tenantsNotifierProvider('p1')).total, 3);
    },
  );
}
