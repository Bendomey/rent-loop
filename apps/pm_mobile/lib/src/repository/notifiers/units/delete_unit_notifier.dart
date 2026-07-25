import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'delete_unit_notifier.g.dart';

class DeleteUnitState extends ApiState {
  DeleteUnitState({super.status, super.errorMessage});
}

@riverpod
class DeleteUnitNotifier extends _$DeleteUnitNotifier {
  @override
  DeleteUnitState build() => DeleteUnitState();

  Future<void> submit({
    required String propertyId,
    required String unitId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = DeleteUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = DeleteUnitState(status: ApiStatus.pending);
    try {
      await ref
          .read(unitApiProvider)
          .deleteUnit(
            clientId: clientId,
            propertyId: propertyId,
            unitId: unitId,
          );
      state = DeleteUnitState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = DeleteUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = DeleteUnitState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure (mirrors LoginNotifier.reset()).
  void reset() => state = DeleteUnitState();
}
