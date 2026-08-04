import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

part 'property_blocks_provider.g.dart';

@riverpod
Future<PropertyBlocksPage> propertyBlocks(
  PropertyBlocksRef ref,
  String propertyId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  // Screen only mounts once a workspace is selected — defensive, not an
  // expected runtime path (same precedent as onboarding_checklist_provider.dart).
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(propertyBlockApiProvider)
      .getBlocks(clientId: clientId, propertyId: propertyId);
}
