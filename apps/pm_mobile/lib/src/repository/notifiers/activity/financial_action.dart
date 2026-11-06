import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/providers/activity/application_detail_provider.dart';
import 'package:rentloop_manager/src/repository/providers/activity/financial_account_provider.dart';
import 'package:rentloop_manager/src/repository/providers/tenants/pending_tenants_provider.dart';

String? workspaceClientId(Ref ref) =>
    ref.read(currentWorkspaceNotifierProvider)?.clientId;

void invalidateFinancials(
  Ref ref, {
  required String propertyId,
  required String applicationId,
  String? accountId,
}) {
  if (accountId != null) {
    ref.invalidate(financialAccountProvider(propertyId, accountId));
  }
  ref.invalidate(applicationDetailProvider(propertyId, applicationId));
  ref.invalidate(pendingTenantsProvider);
}
