import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'add_fee_notifier.g.dart';

class AddFeeState extends ApiState {
  AddFeeState({super.status, super.errorMessage});
}

@riverpod
class AddFeeNotifier extends _$AddFeeNotifier {
  @override
  AddFeeState build() => AddFeeState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required String name,
    required String category,
    required int amount,
    required String currency,
    required DateTime dueDate,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = AddFeeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = AddFeeState(status: ApiStatus.pending);
    try {
      await ref
          .read(financialAccountApiProvider)
          .addCharge(
            clientId: clientId,
            propertyId: propertyId,
            accountId: accountId,
            name: name,
            category: category,
            amount: amount,
            currency: currency,
            dueDate: dueDate,
          );
      invalidateFinancials(
        ref,
        propertyId: propertyId,
        applicationId: applicationId,
        accountId: accountId,
      );
      state = AddFeeState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = AddFeeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = AddFeeState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }

  void reset() => state = AddFeeState();
}
