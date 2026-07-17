import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'update_checklist_item_notifier.g.dart';

class UpdateChecklistItemState extends ApiState {
  UpdateChecklistItemState({super.status, super.errorMessage});
}

@riverpod
class UpdateChecklistItemNotifier extends _$UpdateChecklistItemNotifier {
  @override
  UpdateChecklistItemState build() => UpdateChecklistItemState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String itemId,
    String? description,
    String? status,
    String? notes,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = UpdateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = UpdateChecklistItemState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseChecklistApiProvider)
          .updateItem(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            checklistId: checklistId,
            itemId: itemId,
            description: description,
            status: status,
            notes: notes,
          );
      state = UpdateChecklistItemState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = UpdateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = UpdateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = UpdateChecklistItemState();
}
