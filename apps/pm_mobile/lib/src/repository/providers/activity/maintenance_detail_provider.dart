import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_activity_log_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_comment_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_expense_model.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_detail_provider.g.dart';

/// Read providers behind the single maintenance request screen.
///
/// Every detail endpoint is property-scoped, but the route
/// (`/activity/maintenances/:id`) carries only the request id. The board
/// already holds the full record, so it passes `unit.property_id` through as
/// GoRouter `extra` and every provider here takes it as [propertyIdHint].
/// When the hint is absent — a deep link, or a cold start into the route —
/// [maintenanceRequestPropertyId] recovers it from the cross-property list.
///
/// The three tab providers are separate from [maintenanceRequestDetail] so a
/// tab only costs a request when the user actually opens it, and so one
/// failing tab surfaces its own error instead of blanking the screen.

/// The property id every other provider in this file needs.
///
/// Returns [propertyIdHint] untouched when the caller supplied one. Otherwise
/// it scans the cross-property list (no status filter, one bounded page) for
/// the request and reads the property id off its populated unit. There is no
/// by-id filter on that endpoint, so a request sitting beyond [_scanPageSize]
/// rows is not recoverable — that throws rather than silently rendering the
/// wrong request.
@riverpod
Future<String> maintenanceRequestPropertyId(
  MaintenanceRequestPropertyIdRef ref,
  String requestId,
  String? propertyIdHint,
) async {
  if (propertyIdHint != null && propertyIdHint.isNotEmpty) {
    return propertyIdHint;
  }

  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw StateError('No active workspace.');
  }

  final page = await ref
      .read(maintenanceRequestApiProvider)
      .getMaintenanceRequests(clientId: clientId, pageSize: _scanPageSize);

  for (final row in page.rows) {
    if (row.id == requestId) return row.propertyId;
  }

  throw StateError('Could not locate this request. Open it from the board.');
}

const _scanPageSize = 200;

/// The request itself — hero, attachments, assignments, properties, footer.
@riverpod
Future<MaintenanceRequestModel> maintenanceRequestDetail(
  MaintenanceRequestDetailRef ref,
  String requestId,
  String? propertyIdHint,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw StateError('No active workspace.');
  }
  final propertyId = await ref.watch(
    maintenanceRequestPropertyIdProvider(requestId, propertyIdHint).future,
  );
  return ref
      .read(maintenanceRequestApiProvider)
      .getMaintenanceRequest(
        clientId: clientId,
        propertyId: propertyId,
        requestId: requestId,
      );
}

/// History tab — the request's activity log, newest first.
@riverpod
Future<List<MaintenanceActivityLogModel>> maintenanceRequestActivityLogs(
  MaintenanceRequestActivityLogsRef ref,
  String requestId,
  String? propertyIdHint,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw StateError('No active workspace.');
  }
  final propertyId = await ref.watch(
    maintenanceRequestPropertyIdProvider(requestId, propertyIdHint).future,
  );
  return ref
      .read(maintenanceRequestApiProvider)
      .getActivityLogs(
        clientId: clientId,
        propertyId: propertyId,
        requestId: requestId,
      );
}

/// Comments tab.
@riverpod
Future<List<MaintenanceCommentModel>> maintenanceRequestComments(
  MaintenanceRequestCommentsRef ref,
  String requestId,
  String? propertyIdHint,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw StateError('No active workspace.');
  }
  final propertyId = await ref.watch(
    maintenanceRequestPropertyIdProvider(requestId, propertyIdHint).future,
  );
  return ref
      .read(maintenanceRequestApiProvider)
      .getComments(
        clientId: clientId,
        propertyId: propertyId,
        requestId: requestId,
      );
}

/// Expenses tab.
@riverpod
Future<List<MaintenanceExpenseModel>> maintenanceRequestExpenses(
  MaintenanceRequestExpensesRef ref,
  String requestId,
  String? propertyIdHint,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw StateError('No active workspace.');
  }
  final propertyId = await ref.watch(
    maintenanceRequestPropertyIdProvider(requestId, propertyIdHint).future,
  );
  return ref
      .read(maintenanceRequestApiProvider)
      .getExpenses(
        clientId: clientId,
        propertyId: propertyId,
        requestId: requestId,
      );
}
