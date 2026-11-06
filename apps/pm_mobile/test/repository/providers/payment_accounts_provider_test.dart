import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rentloop_manager/src/api/payment_account_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/storage.dart';
import 'package:rentloop_manager/src/lib/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/payment_accounts_provider.dart';

class _NoStorage extends Storage {
  @override
  Future<String?> read(String key) async => null;

  @override
  Future<void> write(String key, String value) async {}

  @override
  Future<void> delete(String key) async {}
}

class _FakeApi extends PaymentAccountApi {
  _FakeApi(this.rows) : super(tokenManager: TokenManager(_NoStorage()));

  final List<PaymentAccountModel> rows;

  @override
  Future<PaymentAccountsPage> getCollectionAccounts({
    required String clientId,
  }) async => PaymentAccountsPage(
    rows: rows,
    meta: PaginationMetaModel(
      total: rows.length,
      page: 1,
      pageSize: 50,
      hasNextPage: false,
      hasPreviousPage: false,
    ),
  );
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

PaymentAccountModel _account(
  String id, {
  String rail = 'OFFLINE',
  String status = 'ACTIVE',
  bool isDefault = false,
}) => PaymentAccountModel(
  id: id,
  rail: rail,
  status: status,
  isDefault: isDefault,
);

void main() {
  test('keeps only active offline accounts, default first', () async {
    final container = ProviderContainer(
      overrides: [
        paymentAccountApiProvider.overrideWithValue(
          _FakeApi([
            _account('cash'),
            _account('momo', rail: 'MOMO'),
            _account('off', status: 'DISABLED'),
            _account('def', isDefault: true),
          ]),
        ),
        currentWorkspaceNotifierProvider.overrideWith(_SignedIn.new),
      ],
    );
    addTearDown(container.dispose);

    final accounts = await container.read(paymentAccountsProvider.future);
    expect(accounts.map((a) => a.id), ['def', 'cash']);
  });
}
