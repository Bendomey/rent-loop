import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_assignees_notifier.g.dart';

/// Backs both the Assigned Worker and Assigned Manager filter chips with
/// one shared, deduped list of people. Fetches each property's people once,
/// all in parallel, when the filter sheet asks for them; never re-fetches an
/// already-seen property.
@riverpod
class MaintenanceAssigneesNotifier extends _$MaintenanceAssigneesNotifier {
  final Map<String, Future<void>> _fetches = {};
  final Map<String, MaintenanceAssigneeModel> _byId = {};

  bool _disposed = false;

  @override
  List<MaintenanceAssigneeModel> build() {
    ref.onDispose(() => _disposed = true);
    return const [];
  }

  Future<void> ensurePropertiesLoaded(Iterable<String> propertyIds) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) return;

    final ids = propertyIds.toSet();
    if (ids.isEmpty) return;

    final futures = [
      for (final id in ids)
        _fetches.putIfAbsent(id, () => _fetchProperty(clientId, id)),
    ];
    await Future.wait(futures);
    if (_disposed) return;
    state = _byId.values.toList();
  }

  // A failed property is treated as having no people rather than retried.
  Future<void> _fetchProperty(String clientId, String propertyId) async {
    try {
      final people = await ref
          .read(clientUserPropertyApiProvider)
          .getClientUserProperties(clientId: clientId, propertyId: propertyId);
      for (final person in people) {
        _byId[person.id] = person;
      }
    } catch (_) {}
  }
}
