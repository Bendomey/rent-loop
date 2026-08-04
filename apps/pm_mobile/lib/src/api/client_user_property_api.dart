import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';

part 'client_user_property_api.g.dart';

class ClientUserPropertyApi extends AbstractApi {
  ClientUserPropertyApi({required super.tokenManager});

  /// `GET .../client-user-properties?property_id={propertyId}` — no `role`
  /// filter: both the Assigned Worker and Assigned Manager filter chips
  /// draw from this same unfiltered list, per explicit product direction
  /// (not bucketed by the STAFF/MANAGER role field). `property_id` is a
  /// single-value-only filter on this endpoint (confirmed against the
  /// backend handler) — call once per property, never a repeated param.
  Future<List<MaintenanceAssigneeModel>> getClientUserProperties({
    required String clientId,
    required String propertyId,
  }) async {
    final query = <String, String>{
      'property_id': propertyId,
      'populate': 'ClientUser,ClientUser.User',
      'page_size': '200',
    };
    final queryString = Uri(queryParameters: query).query;
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/client-user-properties?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = data['rows'] as List<dynamic>;
    return rows
        .map((row) {
          final clientUser =
              (row as Map<String, dynamic>)['client_user']
                  as Map<String, dynamic>?;
          return clientUser == null
              ? null
              : MaintenanceAssigneeModel.fromJson(clientUser);
        })
        .whereType<MaintenanceAssigneeModel>()
        .toList();
  }

  /// `GET .../properties/me` — properties this client-user is explicitly
  /// linked to via `ClientUserProperty` (no role restriction, unlike the
  /// plain `/properties` endpoint which is ADMIN/OWNER-only and would 403
  /// for STAFF). `PropertyService.CreateProperty` always links the client's
  /// OWNER — and the creator, if different — to every property it creates,
  /// so this is the single source of truth for "properties I can see"
  /// across every role, not just STAFF: both the Properties tab
  /// (PropertiesNotifier) and the maintenance board's Property filter
  /// (activityFilterProperties) go through this one endpoint, by design
  /// — access is always explicit, never role-inferred. Supports the same
  /// pagination/search/status params as `PropertyApi.getProperties`, minus
  /// `archived` (this endpoint's join always excludes soft-deleted
  /// properties — archived-properties management stays on the plain
  /// ADMIN/OWNER-only `/properties` endpoint).
  Future<PropertiesPage> getMyProperties({
    required String clientId,
    int page = 1,
    int pageSize = 20,
    String? status,
    String? search,
    String? order,
    String? orderBy,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      // Required -- the `property` field on each row is only populated by
      // GORM (and therefore serialized) when explicitly preloaded; without
      // this, every row comes back with `"property": null` and gets
      // silently dropped below, regardless of how many rows actually exist.
      'populate': 'Property',
    };
    if (order != null) query['order'] = order;
    if (orderBy != null) query['order_by'] = orderBy;
    if (status != null) query['property_status'] = status;
    if (search != null && search.isNotEmpty) {
      query['query'] = search;
      query['search_fields'] = 'name';
    }
    final queryString = Uri(queryParameters: query).query;
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/properties/me?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = data['rows'] as List<dynamic>;
    final properties = rows
        .map((row) {
          final property =
              (row as Map<String, dynamic>)['property']
                  as Map<String, dynamic>?;
          return property == null ? null : PropertyModel.fromJson(property);
        })
        .whereType<PropertyModel>()
        .toList();
    return PropertiesPage(
      rows: properties,
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }
}

@riverpod
ClientUserPropertyApi clientUserPropertyApi(ClientUserPropertyApiRef ref) =>
    ClientUserPropertyApi(tokenManager: ref.watch(tokenManagerProvider));
