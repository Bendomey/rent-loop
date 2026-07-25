import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';

part 'tenant_api.g.dart';

class TenantsPage {
  TenantsPage({required this.rows, required this.meta});

  final List<TenantModel> rows;
  final PaginationMetaModel meta;
}

class TenantApi extends AbstractApi {
  TenantApi({required super.tokenManager});

  /// Lists tenants across every property the caller can access — not
  /// property-scoped in the URL (`GET .../clients/{client_id}/tenants`,
  /// distinct from every other list endpoint in this app so far, which are
  /// nested under a property). [propertyId] narrows results to one property
  /// via the backend's repeatable `property_id` param (sent as a
  /// one-element list, same pattern as `UnitApi.getUnits()`'s `block_ids`).
  Future<TenantsPage> getTenants({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status, // 'ACTIVE' | 'EXPIRED'
    String? search,
    String? propertyId,
  }) async {
    final query = <String, String>{'page': '$page', 'page_size': '$pageSize'};
    if (status != null) query['status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'first_name,last_name,phone';
    }

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (propertyId != null) 'property_id': [propertyId],
      },
    ).query;

    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/tenants?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return TenantsPage(
      rows: (data['rows'] as List<dynamic>)
          .map((e) => TenantModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }
}

@riverpod
TenantApi tenantApi(TenantApiRef ref) =>
    TenantApi(tokenManager: ref.watch(tokenManagerProvider));
