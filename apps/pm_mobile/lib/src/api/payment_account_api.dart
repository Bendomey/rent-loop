import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';

part 'payment_account_api.g.dart';

class PaymentAccountsPage {
  PaymentAccountsPage({required this.rows, required this.meta});

  final List<PaymentAccountModel> rows;
  final PaginationMetaModel meta;
}

class PaymentAccountApi extends AbstractApi {
  PaymentAccountApi({required super.tokenManager});

  /// [page]/[pageSize] default to a normal listing page size — pass
  /// `page: 1, pageSize: 1` to cheaply read just
  /// [PaymentAccountsPage.meta.total] without fetching real rows (this is
  /// how the onboarding checklist uses it; a future payment-accounts-list
  /// screen calls this same method with real pagination and consumes
  /// [PaymentAccountsPage.rows]).
  Future<PaymentAccountsPage> getPaymentAccounts({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    List<String>? ownerTypes,
    bool? isDefault,
    List<String>? ids,
    String? order,
    String? orderBy,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
    };
    if (order != null) query['order'] = order;
    if (orderBy != null) query['order_by'] = orderBy;
    if (isDefault != null) query['is_default'] = '$isDefault';

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (ownerTypes != null && ownerTypes.isNotEmpty)
          'owner_types': ownerTypes,
        if (ids != null && ids.isNotEmpty) 'ids': ids,
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/payment-accounts?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return PaymentAccountsPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => PaymentAccountModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }
}

@riverpod
PaymentAccountApi paymentAccountApi(PaymentAccountApiRef ref) =>
    PaymentAccountApi(tokenManager: ref.watch(tokenManagerProvider));
