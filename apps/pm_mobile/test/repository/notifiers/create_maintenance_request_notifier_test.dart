import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/create_maintenance_request_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/maintenance_requests_notifier.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _Api extends MaintenanceRequestApi {
  _Api() : super(tokenManager: TokenManager(_NoStorage()));

  Object? createError;
  int fetches = 0;

  @override
  Future<MaintenanceRequestsPage> getMaintenanceRequests({
    required String clientId,
    String? statusLabel,
    int page = 1,
    int pageSize = 20,
    String? priorityLabel,
    String? categoryLabel,
    String? assignedWorkerId,
    String? assignedManagerId,
    List<String> propertyIds = const [],
    List<String> unitIds = const [],
  }) async {
    fetches++;
    return MaintenanceRequestsPage(
      rows: [
        MaintenanceRequestModel.fromJson({
          'id': 'fetch$fetches',
          'code': 'OLD',
          'title': 'Old',
          'category': 'OTHER',
          'priority': 'LOW',
          'status': 'NEW',
          'property_id': 'p1',
        }),
      ],
      meta: PaginationMetaModel(
        total: 1,
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }

  @override
  Future<List<MaintenanceRequestModel>> createMaintenanceRequest({
    required String clientId,
    required String propertyId,
    required List<String> unitIds,
    required List<String> blockIds,
    required String title,
    required String description,
    required String priority,
    required String category,
    required String visibility,
    required List<String> attachments,
  }) async {
    if (createError != null) throw createError!;
    return [
      MaintenanceRequestModel.fromJson({
        'id': 'r1',
        'code': 'ABC',
        'title': title,
        'category': category,
        'priority': priority,
        'status': 'NEW',
        'property_id': propertyId,
      }),
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

class _SignedOut extends CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => null;
}

Future<void> _submit(ProviderContainer container) => container
    .read(createMaintenanceRequestNotifierProvider.notifier)
    .submit(
      propertyId: 'p1',
      unitIds: ['u1'],
      blockIds: [],
      title: 'Leaking tap',
      description: 'Kitchen',
      priority: 'HIGH',
      category: 'PLUMBING',
      visibility: 'TENANT_VISIBLE',
      attachments: [],
    );

void main() {
  late _Api api;

  ProviderContainer build({bool signedIn = true}) {
    final container = ProviderContainer(
      overrides: [
        maintenanceRequestApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(
          signedIn ? _SignedIn.new : _SignedOut.new,
        ),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  setUp(() => api = _Api());

  test('success exposes createdId and refreshes the board', () async {
    final container = build();
    container.listen(maintenanceRequestsNotifierProvider('New'), (_, _) {});
    await container
        .read(maintenanceRequestsNotifierProvider('New').notifier)
        .loadFirstPage(const MaintenanceRequestsQuery());
    expect(
      container.read(maintenanceRequestsNotifierProvider('New')).items,
      hasLength(1),
    );

    await _submit(container);

    final state = container.read(createMaintenanceRequestNotifierProvider);
    expect(state.status, ApiStatus.success);
    expect(state.createdId, 'r1');
    await Future<void>.delayed(Duration.zero);
    final board = container.read(maintenanceRequestsNotifierProvider('New'));
    expect(api.fetches, 2);
    expect(board.items.single.id, 'fetch2');
    expect(board.isLoading, isFalse);
  });

  test('failure exposes the translated message', () async {
    api.createError = ApiException(
      400,
      '{"errors":{"message":"UnitNotAvailable"}}',
    );
    final container = build();

    await _submit(container);

    final state = container.read(createMaintenanceRequestNotifierProvider);
    expect(state.status, ApiStatus.failed);
    expect(state.errorMessage, contains('no longer available'));
    expect(state.createdId, isNull);
  });

  test('no client id fails without calling the API', () async {
    final container = build(signedIn: false);

    await _submit(container);

    final state = container.read(createMaintenanceRequestNotifierProvider);
    expect(state.status, ApiStatus.failed);
    expect(state.errorMessage, isNotNull);
  });
}
