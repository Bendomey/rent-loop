import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _Api extends TenantApplicationApi {
  _Api() : super(tokenManager: TokenManager(_NoStorage()));

  int pendingFetches = 0;
  Object? createError;
  String? createdFor;

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
    pendingFetches++;
    return TenantApplicationsPage(
      rows: const [],
      meta: PaginationMetaModel(
        total: 0,
        page: 1,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }

  @override
  Future<TenantApplicationModel> createApplication({
    required String clientId,
    required String propertyId,
    required CreateTenantApplicationInput input,
  }) async {
    if (createError != null) throw createError!;
    createdFor = propertyId;
    return TenantApplicationModel(id: 'new1', code: 'TA-9');
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

CreateTenantApplicationInput _input() => CreateTenantApplicationInput(
  desiredUnitId: 'u1',
  firstName: 'Ama',
  lastName: 'Mensah',
  phone: '+233241234567',
  gender: 'FEMALE',
);

void main() {
  late _Api api;
  late ProviderContainer container;

  setUp(() {
    api = _Api();
    container = ProviderContainer(
      overrides: [
        tenantApplicationApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
      ],
    );
    addTearDown(container.dispose);
  });

  test('success exposes the created tenant and refreshes pending', () async {
    await container.read(pendingTenantsProvider(null).future);
    api.pendingFetches = 0;

    await container
        .read(createApplicationNotifierProvider.notifier)
        .submit(_input(), propertyId: 'p1');
    await container.read(pendingTenantsProvider(null).future);

    final state = container.read(createApplicationNotifierProvider);
    expect(state.status, ApiStatus.success);
    expect(state.application?.id, 'new1');
    expect(api.createdFor, 'p1');
    expect(api.pendingFetches, 1);
  });

  test('an API error is translated and kept on the state', () async {
    api.createError = ApiException(
      400,
      '{"errors":{"message":"UnitNotAvailable"}}',
    );

    await container
        .read(createApplicationNotifierProvider.notifier)
        .submit(_input(), propertyId: 'p1');

    final state = container.read(createApplicationNotifierProvider);
    expect(state.status, ApiStatus.failed);
    expect(state.errorMessage, contains('no longer available'));
    expect(state.application, isNull);
  });
}
