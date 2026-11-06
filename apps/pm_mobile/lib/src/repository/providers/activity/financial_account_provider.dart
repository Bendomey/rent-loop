import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/financial_account_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/financial_account_model.dart';

part 'financial_account_provider.g.dart';

@riverpod
Future<FinancialAccountDetailModel> financialAccount(
  FinancialAccountRef ref,
  String propertyId,
  String accountId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) throw StateError('No active workspace.');
  return ref
      .read(financialAccountApiProvider)
      .getAccount(
        clientId: clientId,
        propertyId: propertyId,
        accountId: accountId,
      );
}
