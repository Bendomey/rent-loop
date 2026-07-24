import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'delete_property_notifier.g.dart';

class DeletePropertyState extends ApiState {
  DeletePropertyState({
    super.status,
    super.errorMessage,
    this.blockedByOccupancy = false,
  });

  /// True when the backend rejected the delete with `PropertyHasActiveOccupancy`
  /// — the eligibility check the UI ran a moment ago is now stale (someone
  /// else created a lease/booking/application in between). The screen
  /// should refetch the deletion preview and fall through to the Blocked
  /// UI, mirroring the web portal's own re-check.
  final bool blockedByOccupancy;
}

@riverpod
class DeletePropertyNotifier extends _$DeletePropertyNotifier {
  @override
  DeletePropertyState build() => DeletePropertyState();

  Future<void> submit({required String propertyId}) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = DeletePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = DeletePropertyState(status: ApiStatus.pending);
    try {
      await ref
          .read(propertyApiProvider)
          .deleteProperty(clientId: clientId, propertyId: propertyId);
      state = DeletePropertyState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = DeletePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
        blockedByOccupancy: e.message == 'PropertyHasActiveOccupancy',
      );
    } catch (_) {
      state = DeletePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = DeletePropertyState();
}
