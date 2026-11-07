import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/tenant_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/tenant_model.dart';

part 'tenant_detail_provider.g.dart';

@riverpod
Future<TenantModel> tenantDetail(
  TenantDetailRef ref,
  String propertyId,
  String tenantId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) throw StateError('No active workspace.');
  return ref
      .read(tenantApiProvider)
      .getTenant(
        clientId: clientId,
        propertyId: propertyId,
        tenantId: tenantId,
      );
}
