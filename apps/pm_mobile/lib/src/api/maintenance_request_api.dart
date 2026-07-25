import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

part 'maintenance_request_api.g.dart';

class MaintenanceRequestsPage {
  MaintenanceRequestsPage({required this.rows, required this.meta});

  final List<MaintenanceRequestModel> rows;
  final PaginationMetaModel meta;
}

class MaintenanceRequestApi extends AbstractApi {
  MaintenanceRequestApi({required super.tokenManager});

  static const _populate =
      'Unit,AssignedWorker,AssignedWorker.User,AssignedManager,AssignedManager.User';

  /// `GET .../maintenance-requests` — the cross-property "mobile" route
  /// (`ListAcrossProperties` on the backend), built specifically for an
  /// app-wide board that isn't scoped to one property. [statusLabel] is a
  /// display label (e.g. "New"), converted to the API's enum value
  /// internally — callers never pass raw API strings.
  Future<MaintenanceRequestsPage> getMaintenanceRequests({
    required String clientId,
    required String statusLabel,
    int page = 1,
    int pageSize = 20,
    String? priorityLabel,
    String? categoryLabel,
    String? assignedWorkerId,
    String? assignedManagerId,
    List<String> propertyIds = const [],
    List<String> unitIds = const [],
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      'status': mrStatusApiValue(statusLabel),
      'populate': _populate,
    };
    if (priorityLabel != null) {
      query['priority'] = mrPriorityApiValue(priorityLabel);
    }
    if (categoryLabel != null) {
      query['category'] = mrCategoryApiValue(categoryLabel);
    }
    if (assignedWorkerId != null) {
      query['assigned_worker_id'] = assignedWorkerId;
    }
    if (assignedManagerId != null) {
      query['assigned_manager_id'] = assignedManagerId;
    }

    final queryString = Uri(
      queryParameters: {
        ...query,
        if (propertyIds.isNotEmpty) 'property_id': propertyIds,
        if (unitIds.isNotEmpty) 'unit_id': unitIds,
      },
    ).query;
    final response = await execute(
      method: 'GET',
      path: '/api/v1/admin/clients/$clientId/maintenance-requests?$queryString',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return MaintenanceRequestsPage(
      rows: (data['rows'] as List<dynamic>)
          .map(
            (e) => MaintenanceRequestModel.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
      meta: PaginationMetaModel.fromJson(data['meta'] as Map<String, dynamic>),
    );
  }

  /// `PATCH .../properties/{propertyId}/maintenance-requests/{requestId}/status`
  /// — this is a per-property route (unlike the cross-property list above),
  /// matching web's `useUpdateMaintenanceRequestStatus`. [propertyId] comes
  /// from the request's own `unit.propertyId` (populated via the `Unit`
  /// populate path above, backed by the backend fix that makes `property_id`
  /// present on that nested object).
  Future<void> updateStatus({
    required String clientId,
    required String propertyId,
    required String requestId,
    required String statusLabel,
    String? cancellationReason,
  }) async {
    final body = <String, dynamic>{'status': mrStatusApiValue(statusLabel)};
    if (cancellationReason != null) {
      body['cancellation_reason'] = cancellationReason;
    }
    await execute(
      method: 'PATCH',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/maintenance-requests/$requestId/status',
      body: body,
    );
  }
}

@riverpod
MaintenanceRequestApi maintenanceRequestApi(MaintenanceRequestApiRef ref) =>
    MaintenanceRequestApi(tokenManager: ref.watch(tokenManagerProvider));
