import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'create_checklist_notifier.g.dart';

class CreateChecklistState extends ApiState {
  CreateChecklistState({super.status, super.errorMessage});
}

@riverpod
class CreateChecklistNotifier extends _$CreateChecklistNotifier {
  @override
  CreateChecklistState build() => CreateChecklistState();

  Future<void> submit({
    required String propertyId,
    required String leaseId,
    required String type,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreateChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateChecklistState(status: ApiStatus.pending);
    try {
      await ref
          .read(leaseChecklistApiProvider)
          .createChecklist(
            clientId: clientId,
            propertyId: propertyId,
            leaseId: leaseId,
            type: type,
          );
      state = CreateChecklistState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CreateChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CreateChecklistState();
}
