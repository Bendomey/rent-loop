import 'package:rentloop_go/src/api/checklist.dart';
import 'package:rentloop_go/src/api/root.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/api_error_messages.dart';
import 'package:rentloop_go/src/repository/api_state.dart';
import 'package:rentloop_go/src/repository/providers/checklists_provider.dart';

part 'acknowledge_checklist_notifier.g.dart';

class AcknowledgeChecklistState extends ApiState {
  AcknowledgeChecklistState({super.status, super.errorMessage});
}

@riverpod
class AcknowledgeChecklistNotifier extends _$AcknowledgeChecklistNotifier {
  @override
  AcknowledgeChecklistState build() => AcknowledgeChecklistState();

  /// Returns true on success, false on failure.
  Future<bool> acknowledge({
    required String leaseId,
    required String checklistId,
    required String action,
    String? comment,
  }) async {
    state = AcknowledgeChecklistState(status: ApiStatus.pending);
    try {
      await ref
          .read(checklistApiProvider)
          .acknowledgeChecklist(
            leaseId: leaseId,
            checklistId: checklistId,
            action: action,
            comment: comment,
          );
      ref.invalidate(checklistsProvider);
      ref.invalidate(singleChecklistProvider);
      state = AcknowledgeChecklistState(status: ApiStatus.success);
      return true;
    } on ApiException catch (e) {
      state = AcknowledgeChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
      return false;
    } catch (_) {
      state = AcknowledgeChecklistState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return false;
    }
  }
}
