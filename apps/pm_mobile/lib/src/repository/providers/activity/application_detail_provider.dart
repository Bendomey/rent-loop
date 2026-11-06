import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/tenant_application_model.dart';

part 'application_detail_provider.g.dart';

@riverpod
Future<TenantApplicationModel> applicationDetail(
  ApplicationDetailRef ref,
  String propertyId,
  String id,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) throw StateError('No active workspace.');
  return ref
      .read(tenantApplicationApiProvider)
      .getApplication(clientId: clientId, propertyId: propertyId, id: id);
}
