import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/payment_account_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/payment_account_model.dart';

part 'payment_accounts_provider.g.dart';

@riverpod
Future<List<PaymentAccountModel>> paymentAccounts(
  PaymentAccountsRef ref,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) throw StateError('No active workspace.');
  final page = await ref
      .read(paymentAccountApiProvider)
      .getCollectionAccounts(clientId: clientId);
  final active = page.rows
      .where((a) => a.status == 'ACTIVE' && a.rail == 'OFFLINE')
      .toList();
  return [
    ...active.where((a) => a.isDefault),
    ...active.where((a) => !a.isDefault),
  ];
}
