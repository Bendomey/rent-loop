import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/lib/financial/cadence.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'billing_policy_notifier.g.dart';

class BillingPolicyState extends ApiState {
  BillingPolicyState({super.status, super.errorMessage});
}

@riverpod
class BillingPolicyNotifier extends _$BillingPolicyNotifier {
  @override
  BillingPolicyState build() => BillingPolicyState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required BillingChoice choice,
    required int leadDays,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = BillingPolicyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = BillingPolicyState(status: ApiStatus.pending);
    try {
      await ref
          .read(financialAccountApiProvider)
          .updateBillingPolicy(
            clientId: clientId,
            propertyId: propertyId,
            accountId: accountId,
            cadence: cadenceForChoice(choice).cadence,
            interval: cadenceForChoice(choice).interval,
            autoIssueDaysBefore: leadDays,
          );
      invalidateFinancials(
        ref,
        propertyId: propertyId,
        applicationId: applicationId,
        accountId: accountId,
      );
      state = BillingPolicyState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = BillingPolicyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = BillingPolicyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = BillingPolicyState();
}
