import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/lease_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/lease_model.dart';

part 'lease_detail_provider.g.dart';

@riverpod
Future<LeaseModel> leaseDetail(
  LeaseDetailRef ref,
  String propertyId,
  String leaseId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(leaseApiProvider)
      .getLease(clientId: clientId, propertyId: propertyId, leaseId: leaseId);
}
