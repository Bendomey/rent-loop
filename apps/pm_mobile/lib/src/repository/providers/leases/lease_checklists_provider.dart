import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_checklist_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/lease_checklist_model.dart';

part 'lease_checklists_provider.g.dart';

@riverpod
Future<List<LeaseChecklistModel>> leaseChecklists(
  LeaseChecklistsRef ref,
  String propertyId,
  String leaseId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(leaseChecklistApiProvider)
      .getChecklists(
        clientId: clientId,
        propertyId: propertyId,
        leaseId: leaseId,
      );
}
