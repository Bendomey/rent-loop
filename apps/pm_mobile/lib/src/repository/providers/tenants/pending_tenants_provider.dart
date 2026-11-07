import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/tenant_application_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/pagination_meta_model.dart';

part 'pending_tenants_provider.g.dart';

@riverpod
Future<TenantApplicationsPage> pendingTenants(
  PendingTenantsRef ref,
  String? propertyId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    return TenantApplicationsPage(
      rows: const [],
      meta: PaginationMetaModel(
        total: 0,
        page: 1,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      ),
    );
  }
  return ref
      .read(tenantApplicationApiProvider)
      .getTenantApplications(
        clientId: clientId,
        pageSize: 50,
        statusLabel: 'In Progress',
        propertyIds: propertyId == null ? const [] : [propertyId],
        orderBy: 'tenant_applications.created_at',
      );
}
