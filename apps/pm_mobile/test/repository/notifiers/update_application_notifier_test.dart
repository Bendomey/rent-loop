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
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/cancel_application_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/update_application_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
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
  Object? updateError;

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
  Future<TenantApplicationModel> updateApplication({
    required String clientId,
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
  }) async {
    if (updateError != null) throw updateError!;
    return TenantApplicationModel(id: id, code: 'c');
  }

  @override
  Future<void> cancelApplication({
    required String clientId,
    required String propertyId,
    required String id,
    required String reason,
  }) async {}
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

void main() {
  late _Api api;
  late int detailBuilds;
  late int accountBuilds;
  late ProviderContainer container;

  setUp(() {
    detailBuilds = 0;
    accountBuilds = 0;
    api = _Api();
    container = ProviderContainer(
      overrides: [
        tenantApplicationApiProvider.overrideWithValue(api),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
        financialAccountProvider('p1', 'fa').overrideWith((ref) async {
          accountBuilds++;
          return FinancialAccountDetailModel.fromJson({
            'account': {
              'id': 'fa',
              'currency': 'GHS',
              'rent_billing_cadence': 'MANUAL',
              'rent_billing_interval': 0,
              'auto_issue_days_before': 5,
              'status': 'ACTIVE',
            },
            'charges': [],
            'total_charged': 0,
            'total_settled': 0,
            'outstanding_amount': 0,
            'available_credit': 0,
          });
        }),
        applicationDetailProvider('p1', 'a1').overrideWith((ref) async {
          detailBuilds++;
          return TenantApplicationModel(id: 'a1', code: 'c');
        }),
      ],
    );
    addTearDown(container.dispose);
  });

  Future<void> warm() async {
    await container.read(pendingTenantsProvider(null).future);
    await container.read(applicationDetailProvider('p1', 'a1').future);
    api.pendingFetches = 0;
    detailBuilds = 0;
  }

  test(
    'a successful update refetches the detail and pending tenants',
    () async {
      await warm();

      await container
          .read(updateApplicationNotifierProvider.notifier)
          .submit(propertyId: 'p1', id: 'a1', patch: {'rent_fee': 1});
      await container.read(pendingTenantsProvider(null).future);
      await container.read(applicationDetailProvider('p1', 'a1').future);

      expect(
        container.read(updateApplicationNotifierProvider).status,
        ApiStatus.success,
      );
      expect(api.pendingFetches, 1);
      expect(detailBuilds, 1);
    },
  );

  test(
    'a successful cancel refetches the detail and pending tenants',
    () async {
      await warm();

      await container
          .read(cancelApplicationNotifierProvider.notifier)
          .submit(propertyId: 'p1', id: 'a1', reason: 'because');
      await container.read(pendingTenantsProvider(null).future);
      await container.read(applicationDetailProvider('p1', 'a1').future);

      expect(
        container.read(cancelApplicationNotifierProvider).status,
        ApiStatus.success,
      );
      expect(api.pendingFetches, 1);
      expect(detailBuilds, 1);
    },
  );

  test('a rent change re-reads the financial account', () async {
    await container.read(financialAccountProvider('p1', 'fa').future);
    accountBuilds = 0;

    await container
        .read(updateApplicationNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          id: 'a1',
          patch: {'rent_fee': 1},
          accountId: 'fa',
        );
    await container.read(financialAccountProvider('p1', 'fa').future);

    expect(accountBuilds, 1);
  });

  test(
    'a ChargesAlreadyBilled refusal re-reads the financial account',
    () async {
      await container.read(financialAccountProvider('p1', 'fa').future);
      accountBuilds = 0;
      api.updateError = ApiException(
        400,
        '{"errors":{"message":"ChargesAlreadyBilled"}}',
      );

      await container
          .read(updateApplicationNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            id: 'a1',
            patch: {'rent_fee': 1},
            accountId: 'fa',
          );
      await container.read(financialAccountProvider('p1', 'fa').future);

      expect(
        container.read(updateApplicationNotifierProvider).status,
        ApiStatus.failed,
      );
      expect(accountBuilds, 1);
    },
  );

  test('another failure leaves the financial account alone', () async {
    await container.read(financialAccountProvider('p1', 'fa').future);
    accountBuilds = 0;
    api.updateError = ApiException(500, '{"errors":{"message":"Boom"}}');

    await container
        .read(updateApplicationNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          id: 'a1',
          patch: {'rent_fee': 1},
          accountId: 'fa',
        );
    await container.read(financialAccountProvider('p1', 'fa').future);

    expect(accountBuilds, 0);
  });
}
