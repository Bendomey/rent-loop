import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/maintenance_request_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_counts_provider.dart';

part 'maintenance_request_status_notifier.g.dart';

class MaintenanceRequestStatusState extends ApiState {
  MaintenanceRequestStatusState({super.status, super.errorMessage});
}

/// Fires the real status-update mutation for a drag-driven board move.
/// Returns `true`/`false` so the caller (the board, Task 8) knows whether
/// to keep or revert its move, and reloads the affected columns itself
/// with its own current filters — this notifier does not touch column
/// state directly.
@riverpod
class MaintenanceRequestStatusNotifier
    extends _$MaintenanceRequestStatusNotifier {
  @override
  MaintenanceRequestStatusState build() => MaintenanceRequestStatusState();

  Future<bool> updateStatus({
    required MaintenanceRequestModel request,
    required String toStatusLabel,
    String? cancellationReason,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    // The request carries its own property, so this no longer fails when the
    // unit relation was not populated.
    final propertyId = request.propertyId;
    if (clientId == null) {
      state = MaintenanceRequestStatusState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }

    state = MaintenanceRequestStatusState(status: ApiStatus.pending);
    try {
      await ref
          .read(maintenanceRequestApiProvider)
          .updateStatus(
            clientId: clientId,
            propertyId: propertyId,
            requestId: request.id,
            statusLabel: toStatusLabel,
            cancellationReason: cancellationReason,
          );
      // The Activity badge counts open statuses only, so any move into or
      // out of Resolved/Cancelled changes it. Invalidating here covers both
      // entry points — the board's drag-and-drop and the detail screen's
      // status actions.
      ref.invalidate(activityCountsProvider);
      state = MaintenanceRequestStatusState(status: ApiStatus.success);
      return true;
    } on ApiException catch (e) {
      state = MaintenanceRequestStatusState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return false;
    } catch (_) {
      state = MaintenanceRequestStatusState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }
  }
}
