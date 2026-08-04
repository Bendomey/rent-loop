import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'delete_checklist_item_notifier.g.dart';

class DeleteChecklistItemState extends ApiState {
  DeleteChecklistItemState({super.status, super.errorMessage});
}

@riverpod
class DeleteChecklistItemNotifier extends _$DeleteChecklistItemNotifier {
  @override
  DeleteChecklistItemState build() => DeleteChecklistItemState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String itemId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = DeleteChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = DeleteChecklistItemState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseChecklistApiProvider)
          .deleteItem(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            checklistId: checklistId,
            itemId: itemId,
          );
      state = DeleteChecklistItemState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = DeleteChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = DeleteChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = DeleteChecklistItemState();
}
