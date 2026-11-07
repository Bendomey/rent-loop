import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

part 'my_property_roles_provider.g.dart';

@Riverpod(keepAlive: true)
Future<Map<String, String>> myPropertyRoles(MyPropertyRolesRef ref) async {
  final clientId = ref.watch(currentWorkspaceNotifierProvider)?.clientId;
  if (clientId == null) return const {};
  return ref
      .read(clientUserPropertyApiProvider)
      .getMyPropertyRoles(clientId: clientId);
}
