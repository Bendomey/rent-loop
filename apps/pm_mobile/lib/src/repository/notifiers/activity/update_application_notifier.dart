import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';

part 'update_application_notifier.g.dart';

class UpdateApplicationState extends ApiState {
  UpdateApplicationState({super.status, super.errorMessage});
}

@riverpod
class UpdateApplicationNotifier extends _$UpdateApplicationNotifier {
  @override
  UpdateApplicationState build() => UpdateApplicationState();

  Future<void> submit({
    required String propertyId,
    required String id,
    required Map<String, dynamic> patch,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = UpdateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = UpdateApplicationState(status: ApiStatus.pending);
    try {
      await ref
          .read(tenantApplicationApiProvider)
          .updateApplication(
            clientId: clientId,
            propertyId: propertyId,
            id: id,
            patch: patch,
          );
      ref.invalidate(applicationDetailProvider(propertyId, id));
      ref.invalidate(pendingTenantsProvider);
      state = UpdateApplicationState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = UpdateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = UpdateApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = UpdateApplicationState();
}
