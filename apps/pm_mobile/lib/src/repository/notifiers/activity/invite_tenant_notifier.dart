import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';

part 'invite_tenant_notifier.g.dart';

class InviteTenantState extends ApiState {
  InviteTenantState({super.status, super.errorMessage});
}

@riverpod
class InviteTenantNotifier extends _$InviteTenantNotifier {
  @override
  InviteTenantState build() => InviteTenantState();

  Future<void> submit({
    required String propertyId,
    required String unitId,
    String? email,
    String? phone,
  }) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) {
      state = InviteTenantState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = InviteTenantState(status: ApiStatus.pending);
    try {
      await ref
          .read(tenantApplicationApiProvider)
          .inviteTenant(
            clientId: clientId,
            propertyId: propertyId,
            unitId: unitId,
            email: email,
            phone: phone,
          );
      state = InviteTenantState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = InviteTenantState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = InviteTenantState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = InviteTenantState();
}
