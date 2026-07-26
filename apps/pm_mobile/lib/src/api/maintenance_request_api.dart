import 'dart:convert';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/token_manager/token_manager.dart';
import 'package:rentloop_manager/src/lib/maintenance_utils.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_activity_log_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_comment_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_expense_model.dart';
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
  /// internally — callers never pass raw API strings. Passing null omits the
  /// status filter entirely (the backend reads `status` as a repeatable param
  /// and skips the filter when absent), which is how the detail screen finds
  /// a request whose status it does not yet know.
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
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
      if (statusLabel != null) 'status': mrStatusApiValue(statusLabel),
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

  /// Populate paths for the single-request read. Mirrors the web portal's
  /// `apps/property-manager/app/api/maintenance-requests/server.ts` so both
  /// clients render the detail screen from an identical payload — the extra
  /// creator paths (absent from the board's [_populate]) drive the "opened
  /// by" attribution the detail hero shows.
  static const _detailPopulate =
      'Unit,AssignedWorker,AssignedWorker.User,AssignedManager,'
      'AssignedManager.User,CreatedByTenant,CreatedByClientUser.User';

  /// `GET .../properties/{propertyId}/maintenance-requests/{requestId}` — the
  /// single-request read backing the detail screen.
  Future<MaintenanceRequestModel> getMaintenanceRequest({
    required String clientId,
    required String propertyId,
    required String requestId,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/maintenance-requests/$requestId'
          '?populate=$_detailPopulate',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return MaintenanceRequestModel.fromJson(
      json['data'] as Map<String, dynamic>,
    );
  }

  /// `GET .../maintenance-requests/{requestId}/activity_logs` — the History tab.
  ///
  /// The populate list is required, not optional: GORM only serializes
  /// relations that are explicitly requested, so without it every entry comes
  /// back with a null performer and the timeline can't attribute anything.
  /// Matches the web portal's activity tab request exactly.
  Future<List<MaintenanceActivityLogModel>> getActivityLogs({
    required String clientId,
    required String propertyId,
    required String requestId,
    int pageSize = 100,
  }) async {
    final rows = await _getRows(
      clientId: clientId,
      propertyId: propertyId,
      requestId: requestId,
      subPath: 'activity_logs',
      pageSize: pageSize,
      populate:
          'PerformedByClientUser,PerformedByClientUser.User,PerformedByTenant',
    );
    return rows
        .map(
          (e) =>
              MaintenanceActivityLogModel.fromJson(e as Map<String, dynamic>),
        )
        .toList();
  }

  /// `GET .../maintenance-requests/{requestId}/comments` — the Comments tab.
  ///
  /// Populate is required for the same reason as [getActivityLogs]: without
  /// it `created_by_client_user` is null on every row and each comment
  /// renders with no author. Matches the web portal's comments tab.
  Future<List<MaintenanceCommentModel>> getComments({
    required String clientId,
    required String propertyId,
    required String requestId,
    int pageSize = 100,
  }) async {
    final rows = await _getRows(
      clientId: clientId,
      propertyId: propertyId,
      requestId: requestId,
      subPath: 'comments',
      pageSize: pageSize,
      populate: 'CreatedByClientUser,CreatedByClientUser.User',
    );
    return rows
        .map((e) => MaintenanceCommentModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// `GET .../maintenance-requests/{requestId}/expenses` — the Expenses tab.
  Future<List<MaintenanceExpenseModel>> getExpenses({
    required String clientId,
    required String propertyId,
    required String requestId,
    int pageSize = 100,
  }) async {
    final rows = await _getRows(
      clientId: clientId,
      propertyId: propertyId,
      requestId: requestId,
      subPath: 'expenses',
      pageSize: pageSize,
    );
    return rows
        .map((e) => MaintenanceExpenseModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// The three detail sub-resources are all paginated `{data:{rows,meta}}`
  /// list endpoints under the same request path, so they share one fetch.
  /// The detail tabs render a full timeline/thread rather than a paged list,
  /// so callers request a single large page instead of wiring pagination.
  Future<List<dynamic>> _getRows({
    required String clientId,
    required String propertyId,
    required String requestId,
    required String subPath,
    required int pageSize,
    String? populate,
  }) async {
    final response = await execute(
      method: 'GET',
      path:
          '/api/v1/admin/clients/$clientId/properties/$propertyId/maintenance-requests/$requestId/$subPath'
          '?page=1&page_size=$pageSize'
          '${populate == null ? '' : '&populate=$populate'}',
    );
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final data = json['data'] as Map<String, dynamic>;
    return (data['rows'] as List<dynamic>?) ?? const [];
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
