import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/property_block_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_block_model.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/activity/activity_filter_options_provider.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

part 'repair_form_options_provider.g.dart';

/// The backend only lets a property's MANAGER open a repair on it.
@riverpod
Future<List<PropertyModel>> repairPropertyOptions(
  RepairPropertyOptionsRef ref,
) async {
  final properties = await ref.watch(activityFilterPropertiesProvider.future);
  final roles = await ref.watch(myPropertyRolesProvider.future);
  return properties.where((p) => roles[p.id] == 'MANAGER').toList();
}

/// Every unit regardless of status: a repair can be on an occupied one.
@riverpod
Future<({List<PropertyBlockModel> blocks, List<UnitModel> units})>
repairAssetOptions(RepairAssetOptionsRef ref, String propertyId) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) {
    return (blocks: <PropertyBlockModel>[], units: <UnitModel>[]);
  }

  final results = await Future.wait([
    ref
        .read(propertyBlockApiProvider)
        .getBlocks(clientId: clientId, propertyId: propertyId, pageSize: 200),
    ref
        .read(unitApiProvider)
        .getUnits(clientId: clientId, propertyId: propertyId, pageSize: 200),
  ]);
  return (
    blocks: (results[0] as PropertyBlocksPage).rows,
    units: (results[1] as UnitsPage).rows,
  );
}
