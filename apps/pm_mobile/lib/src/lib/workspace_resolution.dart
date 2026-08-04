import 'package:rentloop_manager/src/repository/models/client_user_model.dart';

/// A membership counts as active if the last dot-separated segment of its
/// raw API status string equals "active" case-insensitively. This handles
/// both a stringified enum path like "ClientUser.Status.Active" and a bare
/// "active" value, while avoiding substring collisions a `contains` check
/// would have (e.g. "Inactive" contains the substring "active").
bool isActiveClientUser(ClientUserModel clientUser) {
  final segment = clientUser.status.split('.').last.toLowerCase();
  return segment == 'active';
}

/// Picks the workspace membership that should be auto-selected on cold
/// start or immediately after login, or returns null if the user must
/// choose manually on the workspace picker.
///
/// Auto-selects when there is exactly one active membership, or when
/// [storedClientId] (the last workspace the user explicitly chose) matches
/// one of the active memberships.
ClientUserModel? resolveWorkspace(
  List<ClientUserModel> clientUsers, {
  String? storedClientId,
}) {
  final active = clientUsers.where(isActiveClientUser).toList();

  if (active.length == 1) return active.first;

  if (storedClientId != null) {
    for (final clientUser in active) {
      if (clientUser.clientId == storedClientId) return clientUser;
    }
  }

  return null;
}
