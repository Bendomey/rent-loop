import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'refund_notifier.g.dart';

class RefundState extends ApiState {
  RefundState({
    super.status,
    super.errorMessage,
    this.failedNames = const [],
    this.failedIds = const [],
  });

  final List<String> failedNames;
  final List<String> failedIds;
}

@riverpod
class RefundNotifier extends _$RefundNotifier {
  @override
  RefundState build() => RefundState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required List<({ChargeModel charge, int amount})> refunds,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = RefundState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = RefundState(status: ApiStatus.pending);
    final api = ref.read(financialAccountApiProvider);
    final failed = <ChargeModel>[];
    for (final r in refunds) {
      final c = r.charge;
      try {
        await api.addCharge(
          clientId: clientId,
          propertyId: propertyId,
          accountId: accountId,
          name: 'Refund — ${c.name}',
          category: c.category,
          amount: -r.amount,
          currency: c.currency,
          dueDate: DateTime.now(),
          reversesChargeInstanceId: c.id,
        );
      } catch (_) {
        failed.add(c);
      }
    }

    invalidateFinancials(
      ref,
      propertyId: propertyId,
      applicationId: applicationId,
      accountId: accountId,
    );
    state = failed.length == refunds.length && refunds.isNotEmpty
        ? RefundState(
            status: ApiStatus.failed,
            errorMessage: translateApiErrorMessage(),
            failedNames: failed.map((c) => c.name).toList(),
            failedIds: failed.map((c) => c.id).toList(),
          )
        : RefundState(
            status: ApiStatus.success,
            failedNames: failed.map((c) => c.name).toList(),
            failedIds: failed.map((c) => c.id).toList(),
          );
  }

  void reset() => state = RefundState();
}
