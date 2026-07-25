import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';

/// Client-level role check (`ClientUserModel.role` — OWNER/ADMIN/STAFF).
/// Mirrors the web app's `useHasPermissions` (`app/components/permissions/`)
/// for call sites that need a boolean rather than hiding a whole widget —
/// e.g. building a conditionally-filtered list of menu items.
///
/// UI-hiding convenience only, not a security boundary — the backend already
/// rejects unauthorized requests regardless of what this returns.
bool hasPermission(WidgetRef ref, {List<String>? roles}) {
  final workspace = ref.watch(currentWorkspaceNotifierProvider);
  if (workspace == null) return false;
  if (roles == null || roles.isEmpty) return true;
  final upperRoles = roles.map((r) => r.toUpperCase());
  return upperRoles.contains(workspace.role.toUpperCase());
}

/// Hides [child] entirely unless the current client-user's role is in
/// [roles] (or [roles] is omitted/empty, in which case any authenticated
/// role passes). Mirrors the web app's `PermissionGuard`, which renders
/// `null` when unauthorized — this renders [SizedBox.shrink] instead, since
/// Flutter widgets can't return `null`.
class PermissionGuard extends ConsumerWidget {
  const PermissionGuard({super.key, this.roles, required this.child});

  final List<String>? roles;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return hasPermission(ref, roles: roles) ? child : const SizedBox.shrink();
  }
}
