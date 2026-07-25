import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
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
      path: '/api/v1/admin/clients/$clientId/client-user-properties?$queryString',
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

  /// `GET .../properties/me` — properties this client-user is linked to
  /// (no role restriction, unlike the plain `/properties` endpoint which is
  /// ADMIN/OWNER-only and would 403 for STAFF). Known limitation: for an
  /// OWNER whose access is "unrestricted" rather than via explicit
  /// ClientUserProperty rows, this could under-report versus their true
  /// access — accepted for this pass, not fixed (see design spec).
  Future<List<PropertyModel>> getMyProperties({required String clientId}) async {
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/properties/me?page_size=200',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    final rows = data['rows'] as List<dynamic>;
    return rows
        .map((row) {
          final property =
              (row as Map<String, dynamic>)['property']
                  as Map<String, dynamic>?;
          return property == null ? null : PropertyModel.fromJson(property);
        })
        .whereType<PropertyModel>()
        .toList();
  }
}

@riverpod
ClientUserPropertyApi clientUserPropertyApi(ClientUserPropertyApiRef ref) =>
    ClientUserPropertyApi(tokenManager: ref.watch(tokenManagerProvider));
