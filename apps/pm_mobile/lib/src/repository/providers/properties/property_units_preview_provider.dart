import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

part 'property_units_preview_provider.g.dart';

@riverpod
Future<UnitsPage> propertyUnitsPreview(
  PropertyUnitsPreviewRef ref,
  String propertyId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    throw Exception('No active workspace');
  }

  return ref
      .read(unitApiProvider)
      .getUnits(
        clientId: clientId,
        propertyId: propertyId,
        page: 1,
        pageSize: 5,
      );
}
