import 'package:rentloop_go/src/api/invoice.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/payment_account_model.dart';

part 'payment_accounts_provider.g.dart';

/// Fetches active payment accounts for the property manager of a given lease.
/// Used by the offline payment form so tenants can select where to send payment.
@riverpod
Future<List<PaymentAccountModel>> leasePaymentAccounts(
  LeasePaymentAccountsRef ref,
  String leaseId,
) async {
  return ref.read(invoiceApiProvider).getLeasePaymentAccounts(leaseId);
}
