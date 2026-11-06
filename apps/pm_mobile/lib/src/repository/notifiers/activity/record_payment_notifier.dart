import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';

part 'record_payment_notifier.g.dart';

class RecordPaymentState extends ApiState {
  RecordPaymentState({super.status, super.errorMessage});
}

@riverpod
class RecordPaymentNotifier extends _$RecordPaymentNotifier {
  @override
  RecordPaymentState build() => RecordPaymentState();

  Future<void> submit({
    required String propertyId,
    required String applicationId,
    required String accountId,
    required List<({String chargeId, int amount})> claims,
    required String paymentAccountId,
    required String provider,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = RecordPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = RecordPaymentState(status: ApiStatus.pending);
    final api = ref.read(financialAccountApiProvider);
    try {
      final invoice = await api.composeInvoice(
        clientId: clientId,
        propertyId: propertyId,
        accountId: accountId,
        claims: claims,
      );
      await api.payInvoice(
        clientId: clientId,
        propertyId: propertyId,
        invoiceId: invoice.id,
        paymentAccountId: paymentAccountId,
        amount: invoice.totalAmount,
        provider: provider,
      );
      state = RecordPaymentState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = RecordPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = RecordPaymentState(
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

  void reset() => state = RecordPaymentState();
}
