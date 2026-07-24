import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'restore_property_notifier.g.dart';

class RestorePropertyState extends ApiState {
  RestorePropertyState({super.status, super.errorMessage});
}

@riverpod
class RestorePropertyNotifier extends _$RestorePropertyNotifier {
  @override
  RestorePropertyState build() => RestorePropertyState();

  Future<void> submit({required String propertyId}) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = RestorePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = RestorePropertyState(status: ApiStatus.pending);
    try {
      await ref
          .read(propertyApiProvider)
          .restoreProperty(clientId: clientId, propertyId: propertyId);
      state = RestorePropertyState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = RestorePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = RestorePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = RestorePropertyState();
}
