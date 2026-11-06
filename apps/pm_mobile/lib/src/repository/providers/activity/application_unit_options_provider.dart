import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';
import 'package:rentloop_manager/src/repository/providers/properties/my_property_roles_provider.dart';

part 'application_unit_options_provider.g.dart';

const _bookable = {'Unit.Status.Available', 'Unit.Status.PartiallyOccupied'};

/// Units a tenant can be added to. The backend gates creation on the caller's
/// MANAGER role in the unit's property, so other properties are never asked for.
@riverpod
Future<List<UnitModel>> applicationUnitOptions(
  ApplicationUnitOptionsRef ref,
  String? propertyId,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return const [];

  final roles = await ref.watch(myPropertyRolesProvider.future);
  final managed = [
    for (final e in roles.entries)
      if (e.value == 'MANAGER' && (propertyId == null || e.key == propertyId))
        e.key,
  ];
  if (managed.isEmpty) return const [];

  final units = await ref
      .read(unitApiProvider)
      .getUnitsAcrossProperties(clientId: clientId, propertyIds: managed);
  return units.where((u) => _bookable.contains(u.status)).toList();
}
