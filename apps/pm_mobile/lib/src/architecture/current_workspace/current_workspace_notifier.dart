import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/architecture/workspace_id_manager/workspace_id_manager.dart';
import 'package:rentloop_manager/src/repository/models/client_user_model.dart';

part 'current_workspace_notifier.g.dart';

@Riverpod(keepAlive: true)
class CurrentWorkspaceNotifier extends _$CurrentWorkspaceNotifier {
  @override
  ClientUserModel? build() => null;

  /// Explicitly switch the active workspace and persist the choice.
  Future<void> select(ClientUserModel clientUser) async {
    await ref.read(workspaceIdManagerProvider).save(clientUser.clientId);
    state = clientUser;
  }

  void clear() => state = null;
}
