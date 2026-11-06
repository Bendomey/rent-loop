import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'approve_application_notifier.g.dart';

class ApproveApplicationState extends ApiState {
  ApproveApplicationState({super.status, super.errorMessage, this.lease});

  final ApprovedLeaseModel? lease;
}

@riverpod
class ApproveApplicationNotifier extends _$ApproveApplicationNotifier {
  @override
  ApproveApplicationState build() => ApproveApplicationState();

  Future<void> submit({required String propertyId, required String id}) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = ApproveApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = ApproveApplicationState(status: ApiStatus.pending);
    try {
      final lease = await ref
          .read(tenantApplicationApiProvider)
          .approveApplication(
            clientId: clientId,
            propertyId: propertyId,
            id: id,
          );
      invalidateFinancials(ref, propertyId: propertyId, applicationId: id);
      state = ApproveApplicationState(status: ApiStatus.success, lease: lease);
    } on ApiException catch (e) {
      state = ApproveApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = ApproveApplicationState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = ApproveApplicationState();
}
