import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'submit_checklist_notifier.g.dart';

class SubmitChecklistState extends ApiState {
  SubmitChecklistState({super.status, super.errorMessage});
}

@riverpod
class SubmitChecklistNotifier extends _$SubmitChecklistNotifier {
  @override
  SubmitChecklistState build() => SubmitChecklistState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String checklistId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = SubmitChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = SubmitChecklistState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseChecklistApiProvider)
          .submitChecklist(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            checklistId: checklistId,
          );
      state = SubmitChecklistState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = SubmitChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = SubmitChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = SubmitChecklistState();
}
