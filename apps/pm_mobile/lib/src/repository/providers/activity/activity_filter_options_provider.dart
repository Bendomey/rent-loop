import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/api/unit_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/property_model.dart';
import 'package:rentloop_manager/src/repository/models/unit_model.dart';

part 'activity_filter_options_provider.g.dart';

/// The activity screens' Property filter option list (maintenance board and
/// applications list) — properties the
/// current client-user is explicitly linked to (see
/// `ClientUserPropertyApi.getMyProperties`), same source the Properties tab
/// uses — access is always explicit, never inferred from role.
@riverpod
Future<List<PropertyModel>> activityFilterProperties(
  ActivityFilterPropertiesRef ref,
) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return [];
  final page = await ref
      .read(clientUserPropertyApiProvider)
      .getMyProperties(clientId: clientId, pageSize: 200);
  return page.rows;
}

/// The activity screens' Unit filter option list — units across every
/// property the current client-user has access to.
@riverpod
Future<List<UnitModel>> activityFilterUnits(ActivityFilterUnitsRef ref) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return [];
  return ref.read(unitApiProvider).getUnitsAcrossProperties(clientId: clientId);
}
