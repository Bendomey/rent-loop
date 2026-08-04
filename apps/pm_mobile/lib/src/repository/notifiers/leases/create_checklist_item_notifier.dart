import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'create_checklist_item_notifier.g.dart';

class CreateChecklistItemState extends ApiState {
  CreateChecklistItemState({super.status, super.errorMessage});
}

@riverpod
class CreateChecklistItemNotifier extends _$CreateChecklistItemNotifier {
  @override
  CreateChecklistItemState build() => CreateChecklistItemState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String checklistId,
    required String description,
    required String status,
    String? notes,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateChecklistItemState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseChecklistApiProvider)
          .createItem(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            checklistId: checklistId,
            description: description,
            status: status,
            notes: notes,
          );
      state = CreateChecklistItemState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CreateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateChecklistItemState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CreateChecklistItemState();
}
