import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/add_fee_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/approve_application_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/billing_policy_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/record_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/refund_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/start_billing_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/void_charge_notifier.dart';
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

final _tm = TokenManager(_NoStorage());

class _AppApi extends TenantApplicationApi {
  _AppApi(this.calls) : super(tokenManager: _tm);

  final List<String> calls;
  bool failPatch = false;
  int pendingFetches = 0;
  Object? prepareError;
  TenantApplicationModel? refetched;

  @override
  Future<TenantApplicationModel> getApplication({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    calls.add('refetch');
    return refetched ?? TenantApplicationModel(id: id, code: 'c');
  }

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
    calls.add('patch:${patch['rent_fee']}');
    if (failPatch) throw ApiException(500, '{}');
    return TenantApplicationModel(id: id, code: 'c');
  }

  @override
  Future<String> prepareCharges({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    calls.add('prepare');
    if (prepareError != null) throw prepareError!;
    return 'acc-new';
  }

  @override
  Future<ApprovedLeaseModel> approveApplication({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    calls.add('approve');
    return ApprovedLeaseModel(id: 'lease1', status: 'ACTIVE', tenantId: 't1');
  }
}

class _FinApi extends FinancialAccountApi {
  _FinApi(this.calls) : super(tokenManager: _tm);

  final List<String> calls;
  final Set<String> failFees = {};
  bool failPolicy = false;
  Object? payError;
  Object? composeError;
  Object? voidError;
  Map<String, Object?>? lastCharge;
  int accountFetches = 0;

  @override
  Future<FinancialAccountDetailModel> getAccount({
    required String clientId,
    required String propertyId,
    required String accountId,
  }) async {
    accountFetches++;
    return FinancialAccountDetailModel(
      account: FinancialAccountModel(
        id: accountId,
        currency: 'GHS',
        rentBillingCadence: 'MANUAL',
        rentBillingInterval: 1,
        autoIssueDaysBefore: 0,
        status: 'ACTIVE',
      ),
      charges: const [],
      totalCharged: 0,
      totalSettled: 0,
      outstandingAmount: 0,
      availableCredit: 0,
    );
  }

  @override
  Future<void> addCharge({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String name,
    required String category,
    required int amount,
    required String currency,
    required DateTime dueDate,
    String? reversesChargeInstanceId,
  }) async {
    calls.add('fee:$name');
    lastCharge = {
      'name': name,
      'category': category,
      'amount': amount,
      'reverses': reversesChargeInstanceId,
    };
    if (failFees.contains(name)) throw ApiException(500, '{}');
  }

  @override
  Future<void> voidCharge({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String chargeId,
    required String reason,
  }) async {
    calls.add('void:$chargeId');
    if (voidError != null) throw voidError!;
  }

  @override
  Future<void> updateBillingPolicy({
    required String clientId,
    required String propertyId,
    required String accountId,
    required String cadence,
    int? interval,
    required int autoIssueDaysBefore,
  }) async {
    calls.add('policy:$cadence');
    if (failPolicy) throw ApiException(500, '{}');
  }

  @override
  Future<ComposedInvoice> composeInvoice({
    required String clientId,
    required String propertyId,
    required String accountId,
    required List<({String chargeId, int amount})> claims,
  }) async {
    calls.add('compose');
    if (composeError != null) throw composeError!;
    return ComposedInvoice(id: 'inv1', totalAmount: 500);
  }

  @override
  Future<void> payInvoice({
    required String clientId,
    required String propertyId,
    required String invoiceId,
    required String paymentAccountId,
    required int amount,
    required String provider,
    String? reference,
  }) async {
    calls.add('pay:$amount');
    if (payError != null) throw payError!;
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

ChargeModel _charge(String id, String name, int settled) => ChargeModel(
  id: id,
  name: name,
  category: 'RENT',
  amount: 1000,
  currency: 'GHS',
  dueDate: '2026-01-01T00:00:00Z',
  invoicedAmount: 1000,
  settledAmount: settled,
  outstandingAmount: 0,
  status: 'SETTLED',
);

void main() {
  late List<String> calls;
  late _AppApi appApi;
  late _FinApi finApi;
  late int detailBuilds;
  late ProviderContainer container;

  setUp(() {
    calls = [];
    detailBuilds = 0;
    appApi = _AppApi(calls);
    finApi = _FinApi(calls);
    container = ProviderContainer(
      overrides: [
        tenantApplicationApiProvider.overrideWithValue(appApi),
        financialAccountApiProvider.overrideWithValue(finApi),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
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
    await container.read(financialAccountProvider('p1', 'acc1').future);
    appApi.pendingFetches = 0;
    finApi.accountFetches = 0;
    detailBuilds = 0;
  }

  Future<void> expectInvalidated() async {
    await container.read(pendingTenantsProvider(null).future);
    await container.read(applicationDetailProvider('p1', 'a1').future);
    await container.read(financialAccountProvider('p1', 'acc1').future);
    expect(appApi.pendingFetches, 1);
    expect(detailBuilds, 1);
    expect(finApi.accountFetches, 1);
  }

  Future<StartBillingState> startBilling({String? existing}) async {
    await container
        .read(startBillingNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          existingAccountId: existing,
          rentMinor: 120000,
          currency: 'GHS',
          fees: const [
            (name: 'Agency fee', category: 'FEE', amount: 5000),
            (name: 'Legal fee', category: 'FEE', amount: 3000),
          ],
          choice: BillingChoice.monthly,
          leadDays: 5,
          moveIn: DateTime.utc(2026, 2, 1),
        );
    return container.read(startBillingNotifierProvider);
  }

  group('start billing', () {
    test('runs patch, prepare, fees, policy in order', () async {
      final s = await startBilling();

      expect(calls, [
        'patch:120000',
        'prepare',
        'fee:Agency fee',
        'fee:Legal fee',
        'policy:EVERY_PERIOD',
      ]);
      expect(s.status, ApiStatus.success);
      expect(s.accountId, 'acc-new');
      expect(s.failedFees, isEmpty);
      expect(s.policyFailed, false);
    });

    test('skips prepare when an account already exists', () async {
      final s = await startBilling(existing: 'acc1');

      expect(calls, isNot(contains('prepare')));
      expect(s.accountId, 'acc1');
    });

    test('a failed fee is collected and the result is still success', () async {
      finApi.failFees.add('Agency fee');

      final s = await startBilling();

      expect(s.status, ApiStatus.success);
      expect(s.failedFees, ['Agency fee']);
      expect(calls.last, 'policy:EVERY_PERIOD');
    });

    test('a failed policy is flagged', () async {
      finApi.failPolicy = true;

      final s = await startBilling();

      expect(s.status, ApiStatus.success);
      expect(s.policyFailed, true);
    });

    test('a failed rent patch stops everything', () async {
      appApi.failPatch = true;

      final s = await startBilling();

      expect(s.status, ApiStatus.failed);
      expect(s.errorMessage, 'Could not save the rent. Nothing was created.');
      expect(calls, ['patch:120000']);
    });

    test(
      'any prepare failure refreshes the detail and pending tenants',
      () async {
        await warm();
        appApi.prepareError = Exception('offline');

        final s = await startBilling();

        expect(s.status, ApiStatus.failed);
        await container.read(pendingTenantsProvider(null).future);
        await container.read(applicationDetailProvider('p1', 'a1').future);
        expect(appApi.pendingFetches, 1);
        expect(detailBuilds, 1);
      },
    );

    test('already prepared carries on with the account it finds', () async {
      appApi.prepareError = ApiException(
        409,
        '{"errors":{"message":"ChargesAlreadyPrepared"}}',
      );
      appApi.refetched = TenantApplicationModel.fromJson({
        'id': 'a1',
        'code': 'c',
        'financial_account': {'id': 'acc1'},
      });
      finApi.failFees.add('Legal fee');

      final s = await startBilling();

      expect(calls, [
        'patch:120000',
        'prepare',
        'refetch',
        'fee:Agency fee',
        'fee:Legal fee',
        'policy:EVERY_PERIOD',
      ]);
      expect(s.status, ApiStatus.success);
      expect(s.accountId, 'acc1');
      expect(s.failedFees, ['Legal fee']);
    });

    test('already prepared with no account found still fails', () async {
      appApi.prepareError = ApiException(
        409,
        '{"errors":{"message":"ChargesAlreadyPrepared"}}',
      );

      final s = await startBilling();

      expect(calls, ['patch:120000', 'prepare', 'refetch']);
      expect(s.status, ApiStatus.failed);
      expect(
        s.errorMessage,
        'Billing has already been started for this tenant.',
      );
    });

    test('invalidates the account, detail and pending tenants', () async {
      await warm();
      await startBilling(existing: 'acc1');
      await expectInvalidated();
    });
  });

  test('add fee, void and policy invalidate', () async {
    await warm();
    await container
        .read(addFeeNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          name: 'Late fee',
          category: 'FEE',
          amount: 100,
          currency: 'GHS',
          dueDate: DateTime.utc(2026, 2, 1),
        );
    await container
        .read(voidChargeNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          chargeId: 'ch1',
          reason: 'mistake',
        );
    await container
        .read(billingPolicyNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          choice: BillingChoice.quarterly,
          leadDays: 3,
        );

    expect(container.read(addFeeNotifierProvider).status, ApiStatus.success);
    expect(
      container.read(voidChargeNotifierProvider).status,
      ApiStatus.success,
    );
    expect(
      container.read(billingPolicyNotifierProvider).status,
      ApiStatus.success,
    );
    expect(calls, ['fee:Late fee', 'void:ch1', 'policy:EVERY_N_PERIODS']);
    await expectInvalidated();
  });

  test('a failed void refreshes the account', () async {
    await warm();
    finApi.voidError = ApiException(
      400,
      '{"errors":{"message":"ChargeAlreadyBilled"}}',
    );

    await container
        .read(voidChargeNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          chargeId: 'ch1',
          reason: 'mistake',
        );

    expect(container.read(voidChargeNotifierProvider).status, ApiStatus.failed);
    await expectInvalidated();
  });

  group('record payment', () {
    Future<RecordPaymentState> record() async {
      await container
          .read(recordPaymentNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            applicationId: 'a1',
            accountId: 'acc1',
            claims: const [(chargeId: 'ch1', amount: 500)],
            paymentAccountId: 'pa1',
            provider: 'CASH',
          );
      return container.read(recordPaymentNotifierProvider);
    }

    test('composes then pays the bill total', () async {
      final s = await record();

      expect(calls, ['compose', 'pay:500']);
      expect(s.status, ApiStatus.success);
    });

    test('a compose failure refreshes the account too', () async {
      await warm();
      finApi.composeError = ApiException(
        400,
        '{"errors":{"message":"ClaimExceedsChargeBalance"}}',
      );

      final s = await record();

      expect(s.status, ApiStatus.failed);
      expect(s.errorMessage, 'Part of that is already on a bill.');
      await expectInvalidated();
    });

    test('a pay failure still refreshes the account', () async {
      await warm();
      finApi.payError = ApiException(
        400,
        '{"errors":{"message":"PaymentExceedsInvoiceBalance"}}',
      );

      final s = await record();

      expect(s.status, ApiStatus.failed);
      expect(s.errorMessage, 'That is more than the bill has left on it.');
      await expectInvalidated();
    });
  });

  test('refund adds a negative reversal per charge', () async {
    await warm();
    finApi.failFees.add('Refund — Deposit');

    await container
        .read(refundNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          refunds: [
            (charge: _charge('ch1', 'Rent', 700), amount: 700),
            (charge: _charge('ch2', 'Deposit', 300), amount: 300),
          ],
        );
    final s = container.read(refundNotifierProvider);

    expect(calls, ['fee:Refund — Rent', 'fee:Refund — Deposit']);
    expect(s.failedNames, ['Deposit']);
    expect(s.failedIds, ['ch2']);
    await expectInvalidated();

    finApi.failFees.clear();
    await container
        .read(refundNotifierProvider.notifier)
        .submit(
          propertyId: 'p1',
          applicationId: 'a1',
          accountId: 'acc1',
          refunds: [(charge: _charge('ch1', 'Rent', 700), amount: 400)],
        );
    expect(finApi.lastCharge, {
      'name': 'Refund — Rent',
      'category': 'RENT',
      'amount': -400,
      'reverses': 'ch1',
    });
    expect(container.read(refundNotifierProvider).status, ApiStatus.success);
  });

  test('approve carries the lease and refreshes pending tenants', () async {
    await warm();

    await container
        .read(approveApplicationNotifierProvider.notifier)
        .submit(propertyId: 'p1', id: 'a1');
    final s = container.read(approveApplicationNotifierProvider);
    await container.read(pendingTenantsProvider(null).future);

    expect(s.status, ApiStatus.success);
    expect(s.lease?.id, 'lease1');
    expect(appApi.pendingFetches, 1);
  });
}
