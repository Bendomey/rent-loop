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

/// Property-scoped role check (`ClientUserProperty.role` — MANAGER/STAFF)
/// for the property currently being viewed. Mirrors the web app's
/// `useHasPropertyPermissions`, with one deliberate difference: this takes
/// the already-resolved [role] as a plain value rather than fetching it
/// itself — the role lookup is async (`myPropertyRoleProvider`, a
/// per-property API call), so the caller watches that provider and passes
/// `.valueOrNull` down. Treats a still-loading/unknown role (`null`) the
/// same as unauthorized, so a button never flashes visible before hiding.
bool hasPropertyPermission({required String? role, List<String>? roles}) {
  if (role == null) return false;
  if (roles == null || roles.isEmpty) return true;
  final upperRoles = roles.map((r) => r.toUpperCase());
  return upperRoles.contains(role.toUpperCase());
}

/// Hides [child] entirely unless [role] (the current client-user's role for
/// the property being viewed — see [hasPropertyPermission]) is in [roles].
/// Mirrors the web app's `PropertyPermissionGuard`.
class PropertyPermissionGuard extends StatelessWidget {
  const PropertyPermissionGuard({
    super.key,
    required this.role,
    this.roles,
    required this.child,
  });

  final String? role;
  final List<String>? roles;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return hasPropertyPermission(role: role, roles: roles)
        ? child
        : const SizedBox.shrink();
  }
}
