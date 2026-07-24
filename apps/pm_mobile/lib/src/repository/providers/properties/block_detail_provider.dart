import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';

part 'block_detail_provider.g.dart';

@riverpod
Future<PropertyBlockModel> blockDetail(
  BlockDetailRef ref,
  String propertyId,
  String blockId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  // Screen only mounts once a workspace is selected — defensive, not an
  // expected runtime path (same precedent as onboarding_checklist_provider.dart).
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(propertyBlockApiProvider)
      .getBlock(clientId: clientId, propertyId: propertyId, blockId: blockId);
}
