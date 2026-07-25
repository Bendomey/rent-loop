import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'maintenance_filter_options_provider.g.dart';

/// The maintenance board's Property filter option list — properties the
/// current client-user has access to (see ClientUserPropertyApi.getMyProperties
/// for the known OWNER-completeness caveat).
@riverpod
Future<List<PropertyModel>> maintenanceFilterProperties(
  MaintenanceFilterPropertiesRef ref,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return [];
  return ref
      .read(clientUserPropertyApiProvider)
      .getMyProperties(clientId: clientId);
}

/// The maintenance board's Unit filter option list — units across every
/// property the current client-user has access to.
@riverpod
Future<List<UnitModel>> maintenanceFilterUnits(
  MaintenanceFilterUnitsRef ref,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return [];
  return ref.read(unitApiProvider).getUnitsAcrossProperties(clientId: clientId);
}
