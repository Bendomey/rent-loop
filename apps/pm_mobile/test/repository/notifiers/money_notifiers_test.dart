import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/invoice_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/models/invoice_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_stats_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bills_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/properties/property_stats_provider.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/record_bill_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/verify_payment_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
import 'package:rentloop_manager/src/repository/providers/money/bill_detail_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

final _tm = TokenManager(_NoStorage());

InvoiceModel _bill(String id) => InvoiceModel(
  id: id,
  code: 'INV-$id',
  status: 'ISSUED',
  totalAmount: 1000,
  currency: 'GHS',
  contextType: 'LEASE',
);

class _InvoiceApi extends InvoiceApi {
  _InvoiceApi() : super(tokenManager: _tm);

  final List<Map<String, Object?>> listCalls = [];
  Future<void> Function(int page, String? search)? gate;
  int? failPage;
  InvoiceModel Function(String? search)? itemFor;
  int detailFetches = 0;
  final List<Map<String, Object?>> verifyCalls = [];
  ApiException? verifyError;

  @override
  Future<InvoicesPage> listInvoices({
    required String clientId,
    required List<String> statuses,
    List<String>? propertyIds,
    String payeeType = 'PROPERTY_OWNER',
    required String orderBy,
    required String order,
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    listCalls.add({
      'statuses': statuses,
      'propertyIds': propertyIds,
      'payeeType': payeeType,
      'orderBy': orderBy,
      'order': order,
      'page': page,
      'pageSize': pageSize,
      'search': search,
    });
    await gate?.call(page, search);
    if (page == failPage) throw StateError('page failed');
    return InvoicesPage(
      rows: [itemFor?.call(search) ?? _bill('p$page')],
      meta: PaginationMetaModel(
        total: 2,
        page: page,
        pageSize: pageSize,
        hasNextPage: page == 1,
        hasPreviousPage: page > 1,
      ),
    );
  }

  @override
  Future<InvoiceModel> getInvoice({
    required String clientId,
    required String propertyId,
    required String id,
  }) async {
    detailFetches++;
    return _bill(id);
  }

  @override
  Future<void> verifyPayment({
    required String clientId,
    required String propertyId,
    required String paymentId,
    required bool isSuccessful,
    String? reason,
  }) async {
    verifyCalls.add({
      'paymentId': paymentId,
      'isSuccessful': isSuccessful,
      'reason': reason,
    });
    if (verifyError != null) throw verifyError!;
  }
}

class _FinApi extends FinancialAccountApi {
  _FinApi() : super(tokenManager: _tm);

  int accountFetches = 0;
  ApiException? payError;
  Map<String, Object?>? payArgs;

  @override
  Future<FinancialAccountDetailModel> getAccount({
    required String clientId,
    required String propertyId,
    required String accountId,
  }) async {
    accountFetches++;
    throw StateError('not needed');
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
    payArgs = {
      'invoiceId': invoiceId,
      'paymentAccountId': paymentAccountId,
      'amount': amount,
      'provider': provider,
      'reference': reference,
    };
    if (payError != null) throw payError!;
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
  late _InvoiceApi invoiceApi;
  late _FinApi finApi;
  late ProviderContainer container;
  var statsBuilds = 0;

  setUp(() {
    statsBuilds = 0;
    invoiceApi = _InvoiceApi();
    finApi = _FinApi();
    container = ProviderContainer(
      overrides: [
        invoiceApiProvider.overrideWithValue(invoiceApi),
        financialAccountApiProvider.overrideWithValue(finApi),
        currentWorkspaceNotifierProvider.overrideWith(_SignedInWorkspace.new),
        propertyStatsProvider('p1').overrideWith((ref) async {
          statsBuilds++;
          return const PropertyStats();
        }),
      ],
    );
    addTearDown(container.dispose);
  });

  Future<void> settle() => Future<void>.delayed(Duration.zero);

  group('BillsNotifier', () {
    test('loads its first page as soon as it is built', () async {
      final provider = billsNotifierProvider(BillsView.owing, null);
      container.listen(provider, (_, __) {});
      expect(container.read(provider).hasLoaded, isFalse);
      await settle();

      expect(invoiceApi.listCalls, hasLength(1));
      expect(container.read(provider).hasLoaded, isTrue);
      expect(container.read(provider).items, isNotEmpty);
    });

    test('reloads after the family is invalidated', () async {
      final provider = billsNotifierProvider(BillsView.owing, null);
      container.listen(provider, (_, __) {});
      await settle();
      container.invalidate(billsNotifierProvider);
      await settle();

      expect(invoiceApi.listCalls, hasLength(2));
      expect(container.read(provider).items, isNotEmpty);
    });

    test('keeps the search across a rebuild', () async {
      final provider = billsNotifierProvider(BillsView.owing, null);
      container.listen(provider, (_, __) {});
      await settle();
      await container.read(provider.notifier).loadFirstPage(search: 'INV-9');
      container.invalidate(billsNotifierProvider);
      await settle();

      expect(invoiceApi.listCalls.last['search'], 'INV-9');
    });

    test('the picker has its own list apart from the Rent tab', () async {
      final rent = billsNotifierProvider(BillsView.owing, null);
      final picker = billsNotifierProvider(BillsView.owing, null, picker: true);
      container.listen(rent, (_, __) {});
      container.listen(picker, (_, __) {});
      await settle();
      await container.read(picker.notifier).loadFirstPage(search: 'INV-9');

      expect(
        invoiceApi.listCalls.where((c) => c['search'] == 'INV-9'),
        hasLength(1),
      );
      expect(container.read(rent).items, isNotEmpty);
      expect(
        container.read(rent.notifier),
        isNot(same(container.read(picker.notifier))),
      );
    });

    test('a refresh clears an earlier load-more failure', () async {
      final provider = billsNotifierProvider(BillsView.owing, null);
      container.listen(provider, (_, __) {});
      await settle();
      invoiceApi.failPage = 2;
      await container.read(provider.notifier).loadNextPage();
      expect(container.read(provider).loadMoreFailed, isTrue);

      invoiceApi.failPage = 1;
      await container.read(provider.notifier).loadFirstPage();
      expect(container.read(provider).loadMoreFailed, isFalse);
      invoiceApi.failPage = null;
      await container.read(provider.notifier).loadFirstPage();
      expect(container.read(provider).loadMoreFailed, isFalse);
    });

    test('the newest search wins when responses arrive out of order', () async {
      final provider = billsNotifierProvider(BillsView.owing, null);
      container.listen(provider, (_, __) {});
      await settle();
      final slow = Completer<void>();
      invoiceApi.gate = (page, search) async {
        if (search == 'old') await slow.future;
      };
      invoiceApi.itemFor = (search) => _bill(search ?? 'none');

      final first = container
          .read(provider.notifier)
          .loadFirstPage(search: 'old');
      await container.read(provider.notifier).loadFirstPage(search: 'new');
      slow.complete();
      await first;

      expect(container.read(provider).items.single.id, 'new');
    });

    test(
      'owing view asks for open bills by due date, filtered by property',
      () async {
        container.listen(
          billsNotifierProvider(BillsView.owing, 'p1'),
          (_, __) {},
        );
        await settle();

        final call = invoiceApi.listCalls.single;
        expect(call['statuses'], ['ISSUED', 'PARTIALLY_PAID']);
        expect(call['propertyIds'], ['p1']);
        expect(call['orderBy'], 'invoices.due_date');
        expect(call['order'], 'asc');
        expect(call['pageSize'], 20);
        final state = container.read(
          billsNotifierProvider(BillsView.owing, 'p1'),
        );
        expect(state.items.single.id, 'p1');
        expect(state.total, 2);
        expect(state.hasNextPage, isTrue);
      },
    );

    test('paid view asks for paid bills, newest payment first', () async {
      container.listen(billsNotifierProvider(BillsView.paid, null), (_, __) {});
      await container
          .read(billsNotifierProvider(BillsView.paid, null).notifier)
          .loadFirstPage(search: 'INV');

      final call = invoiceApi.listCalls.last;
      expect(call['statuses'], ['PAID']);
      expect(call['propertyIds'], isNull);
      expect(call['orderBy'], 'invoices.paid_at');
      expect(call['order'], 'desc');
      expect(call['search'], 'INV');
    });

    test('loadNextPage requests page 2 and appends', () async {
      container.listen(
        billsNotifierProvider(BillsView.owing, null),
        (_, __) {},
      );
      final notifier = container.read(
        billsNotifierProvider(BillsView.owing, null).notifier,
      );
      await settle();
      await notifier.loadFirstPage(search: 'x');
      await notifier.loadNextPage();

      expect(invoiceApi.listCalls.last['page'], 2);
      expect(invoiceApi.listCalls.last['search'], 'x');
      final state = container.read(
        billsNotifierProvider(BillsView.owing, null),
      );
      expect(state.items.map((e) => e.id), ['p1', 'p2']);
      expect(state.currentPage, 2);
      expect(state.hasNextPage, isFalse);
    });
  });

  group('write notifiers', () {
    void watchAll() {
      container.listen(recordBillPaymentNotifierProvider, (_, __) {});
      container.listen(verifyPaymentNotifierProvider, (_, __) {});
      container.listen(billDetailProvider('p1', 'b1'), (_, __) {});
      container.listen(financialAccountProvider('p1', 'fa1'), (_, __) {});
      container.listen(
        billsNotifierProvider(BillsView.owing, null),
        (_, __) {},
      );
    }

    Future<void> seed() async {
      watchAll();
      await container.read(billDetailProvider('p1', 'b1').future);
      await container
          .read(billsNotifierProvider(BillsView.owing, null).notifier)
          .loadFirstPage();
      await Future<void>.delayed(Duration.zero);
      invoiceApi.detailFetches = 0;
      invoiceApi.listCalls.clear();
      finApi.accountFetches = 0;
    }

    test('recording a payment invalidates the property stats', () async {
      await seed();
      container.listen(propertyStatsProvider('p1'), (_, __) {});
      await settle();
      final before = statsBuilds;

      await container
          .read(recordBillPaymentNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            invoiceId: 'b1',
            amount: 500,
            paymentAccountId: 'pa1',
            provider: 'CASH',
            reference: 'r',
            financialAccountId: 'fa1',
          );
      await settle();

      expect(statsBuilds, before + 1);
    });

    test('recording a payment refreshes the lists, bill and account', () async {
      await seed();
      await container
          .read(recordBillPaymentNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            invoiceId: 'b1',
            amount: 500,
            paymentAccountId: 'pa1',
            provider: 'CASH',
            reference: 'r',
            financialAccountId: 'fa1',
          );
      await Future<void>.delayed(Duration.zero);

      expect(
        container.read(recordBillPaymentNotifierProvider).status,
        ApiStatus.success,
      );
      expect(finApi.payArgs, {
        'invoiceId': 'b1',
        'paymentAccountId': 'pa1',
        'amount': 500,
        'provider': 'CASH',
        'reference': 'r',
      });
      expect(invoiceApi.detailFetches, 1);
      expect(finApi.accountFetches, 1);
      expect(invoiceApi.listCalls, hasLength(1));
      expect(
        container.read(billsNotifierProvider(BillsView.owing, null)).items,
        isNotEmpty,
      );
    });

    test('a failed payment keeps the message and refreshes the bill', () async {
      await seed();
      finApi.payError = ApiException(
        400,
        '{"errors":{"message":"PaymentExceedsInvoiceBalance"}}',
      );
      await container
          .read(recordBillPaymentNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            invoiceId: 'b1',
            amount: 5000,
            paymentAccountId: 'pa1',
            provider: 'CASH',
          );
      await Future<void>.delayed(Duration.zero);

      final state = container.read(recordBillPaymentNotifierProvider);
      expect(state.status, ApiStatus.failed);
      expect(state.errorMessage, 'That is more than the bill has left on it.');
      expect(invoiceApi.detailFetches, 1);
      expect(
        container.read(billsNotifierProvider(BillsView.owing, null)).items,
        isNotEmpty,
      );
    });

    test(
      'verifying a payment sends the decision and refreshes everything',
      () async {
        await seed();
        await container
            .read(verifyPaymentNotifierProvider.notifier)
            .submit(
              propertyId: 'p1',
              invoiceId: 'b1',
              paymentId: 'pay1',
              received: false,
              reason: 'never came',
              financialAccountId: 'fa1',
            );
        await Future<void>.delayed(Duration.zero);

        expect(invoiceApi.verifyCalls.single, {
          'paymentId': 'pay1',
          'isSuccessful': false,
          'reason': 'never came',
        });
        expect(
          container.read(verifyPaymentNotifierProvider).status,
          ApiStatus.success,
        );
        expect(invoiceApi.detailFetches, 1);
        expect(finApi.accountFetches, 1);
        expect(invoiceApi.listCalls, hasLength(1));
        expect(
          container.read(billsNotifierProvider(BillsView.owing, null)).items,
          isNotEmpty,
        );
      },
    );

    test('a failed verify refreshes the bill only', () async {
      await seed();
      invoiceApi.verifyError = ApiException(
        400,
        '{"errors":{"message":"payment is not in pending status"}}',
      );
      await container
          .read(verifyPaymentNotifierProvider.notifier)
          .submit(
            propertyId: 'p1',
            invoiceId: 'b1',
            paymentId: 'pay1',
            received: true,
            financialAccountId: 'fa1',
          );
      await Future<void>.delayed(Duration.zero);

      final state = container.read(verifyPaymentNotifierProvider);
      expect(state.status, ApiStatus.failed);
      expect(state.errorMessage, 'This payment was already handled.');
      expect(invoiceApi.detailFetches, 1);
      expect(finApi.accountFetches, 0);
    });
  });
}
