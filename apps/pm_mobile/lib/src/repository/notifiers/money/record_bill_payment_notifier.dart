import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bill_refresh.dart';

part 'record_bill_payment_notifier.g.dart';

class RecordBillPaymentState extends ApiState {
  RecordBillPaymentState({super.status, super.errorMessage});
}

@riverpod
class RecordBillPaymentNotifier extends _$RecordBillPaymentNotifier {
  @override
  RecordBillPaymentState build() => RecordBillPaymentState();

  Future<void> submit({
    required String propertyId,
    required String invoiceId,
    required int amount,
    required String paymentAccountId,
    required String provider,
    String? reference,
    String? financialAccountId,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = RecordBillPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = RecordBillPaymentState(status: ApiStatus.pending);
    var succeeded = false;
    try {
      await ref
          .read(financialAccountApiProvider)
          .payInvoice(
            clientId: clientId,
            propertyId: propertyId,
            invoiceId: invoiceId,
            paymentAccountId: paymentAccountId,
            amount: amount,
            provider: provider,
            reference: reference,
          );
      succeeded = true;
      state = RecordBillPaymentState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = RecordBillPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = RecordBillPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
    refreshBill(
      ref,
      propertyId: propertyId,
      invoiceId: invoiceId,
      changed: succeeded,
      financialAccountId: financialAccountId,
    );
  }

  void reset() => state = RecordBillPaymentState();
}
