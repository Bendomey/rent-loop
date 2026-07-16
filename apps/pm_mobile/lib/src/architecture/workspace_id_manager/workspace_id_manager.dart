import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/architecture/secure_storage/secure_storage.dart';
import 'package:rentloop_manager/src/lib/workspace_id_manager.dart';

part 'workspace_id_manager.g.dart';

@riverpod
WorkspaceIdManager workspaceIdManager(WorkspaceIdManagerRef ref) {
  final storage = ref.watch(secureStorageProvider);
  return WorkspaceIdManager(storage);
}
