import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';

part 'cancel_application_notifier.g.dart';

class CancelApplicationState extends ApiState {
  CancelApplicationState({super.status, super.errorMessage});
}

@riverpod
class CancelApplicationNotifier extends _$CancelApplicationNotifier {
  @override
  CancelApplicationState build() => CancelApplicationState();

  Future<void> submit({
    required String propertyId,
    required String id,
    required String reason,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = CancelApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = CancelApplicationState(status: ApiStatus.pending);
    try {
      await ref
          .read(tenantApplicationApiProvider)
          .cancelApplication(
            clientId: clientId,
            propertyId: propertyId,
            id: id,
            reason: reason,
          );
      ref.invalidate(applicationDetailProvider(propertyId, id));
      ref.invalidate(pendingTenantsProvider);
      state = CancelApplicationState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CancelApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CancelApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = CancelApplicationState();
}
