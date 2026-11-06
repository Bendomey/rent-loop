import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'void_charge_notifier.g.dart';

class VoidChargeState extends ApiState {
  VoidChargeState({super.status, super.errorMessage});
}

@riverpod
class VoidChargeNotifier extends _$VoidChargeNotifier {
  @override
  VoidChargeState build() => VoidChargeState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required String chargeId,
    required String reason,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = VoidChargeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = VoidChargeState(status: ApiStatus.pending);
    try {
      await ref
          .read(financialAccountApiProvider)
          .voidCharge(
            clientId: clientId,
            propertyId: propertyId,
            accountId: accountId,
            chargeId: chargeId,
            reason: reason,
          );
      state = VoidChargeState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = VoidChargeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = VoidChargeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
    invalidateFinancials(
      ref,
      propertyId: propertyId,
      applicationId: applicationId,
      accountId: accountId,
    );
  }

  void reset() => state = VoidChargeState();
}
