import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'delete_block_notifier.g.dart';

class DeleteBlockState extends ApiState {
  DeleteBlockState({super.status, super.errorMessage});
}

@riverpod
class DeleteBlockNotifier extends _$DeleteBlockNotifier {
  @override
  DeleteBlockState build() => DeleteBlockState();

  Future<void> submit({
    required String propertyId,
    required String blockId,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = DeleteBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = DeleteBlockState(status: ApiStatus.pending);
    try {
      await ref
          .read(propertyBlockApiProvider)
          .deleteBlock(
            clientId: clientId,
            propertyId: propertyId,
            blockId: blockId,
          );
      state = DeleteBlockState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = DeleteBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = DeleteBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure (mirrors LoginNotifier.reset()).
  void reset() => state = DeleteBlockState();
}
