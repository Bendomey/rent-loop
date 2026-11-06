import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/invoice_api.dart';
import 'package:rentloop_manager/src/api/root.dart';
import 'package:rentloop_manager/src/lib/api_error_messages.dart';
import 'package:rentloop_manager/src/repository/api_state.dart';
import 'package:rentloop_manager/src/repository/notifiers/activity/financial_action.dart';
import 'package:rentloop_manager/src/repository/notifiers/money/bill_refresh.dart';

part 'verify_payment_notifier.g.dart';

class VerifyPaymentState extends ApiState {
  VerifyPaymentState({super.status, super.errorMessage});
}

@riverpod
class VerifyPaymentNotifier extends _$VerifyPaymentNotifier {
  @override
  VerifyPaymentState build() => VerifyPaymentState();

  Future<void> submit({
    required String propertyId,
    required String invoiceId,
    required String paymentId,
    required bool received,
    String? reason,
    String? financialAccountId,
  }) async {
    final clientId = workspaceClientId(ref);
    if (clientId == null) {
      state = VerifyPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
      return;
    }

    state = VerifyPaymentState(status: ApiStatus.pending);
    var succeeded = false;
    try {
      await ref
          .read(invoiceApiProvider)
          .verifyPayment(
            clientId: clientId,
            propertyId: propertyId,
            paymentId: paymentId,
            isSuccessful: received,
            reason: reason,
          );
      succeeded = true;
      state = VerifyPaymentState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = VerifyPaymentState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = VerifyPaymentState(
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

  void reset() => state = VerifyPaymentState();
}
