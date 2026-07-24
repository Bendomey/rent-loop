import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'create_block_notifier.g.dart';

class CreateBlockState extends ApiState {
  CreateBlockState({super.status, super.errorMessage});
}

@riverpod
class CreateBlockNotifier extends _$CreateBlockNotifier {
  @override
  CreateBlockState build() => CreateBlockState();

  Future<void> submit({
    required String propertyId,
    required String name,
    String? description,
    List<String>? images,
    required String status,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CreateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CreateBlockState(status: ApiStatus.pending);
    try {
      await ref
          .read(propertyBlockApiProvider)
          .createBlock(
            clientId: clientId,
            propertyId: propertyId,
            name: name,
            description: description,
            images: images,
            status: status,
          );
      state = CreateBlockState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CreateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreateBlockState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  /// Clears a previous API-sourced failure (mirrors LoginNotifier.reset()).
  void reset() => state = CreateBlockState();
}
