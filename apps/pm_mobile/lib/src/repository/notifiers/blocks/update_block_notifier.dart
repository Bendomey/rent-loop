import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'update_block_notifier.g.dart';

class UpdateBlockState extends ApiState {
  UpdateBlockState({super.status, super.errorMessage});
}

@riverpod
class UpdateBlockNotifier extends _$UpdateBlockNotifier {
  @override
  UpdateBlockState build() => UpdateBlockState();

  Future<void> submit({
    required String propertyId,
    required String blockId,
    String? name,
    String? description,
    List<String>? images,
    String? status,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = UpdateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = UpdateBlockState(status: ApiStatus.pending);
    try {
      await ref
          .read(propertyBlockApiProvider)
          .updateBlock(
            clientId: clientId,
            propertyId: propertyId,
            blockId: blockId,
            name: name,
            description: description,
            images: images,
            status: status,
          );
      state = UpdateBlockState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = UpdateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = UpdateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure (mirrors LoginNotifier.reset()).
  void reset() => state = UpdateBlockState();
}
