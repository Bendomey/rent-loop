import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:rentloop_manager/src/api/client_user_property_api.dart';
import 'package:rentloop_manager/src/architecture/current_workspace/current_workspace_notifier.dart';
import 'package:rentloop_manager/src/repository/models/maintenance_request_model.dart';

part 'maintenance_assignees_notifier.g.dart';

/// Backs both the Assigned Worker and Assigned Manager filter chips with
/// one shared, deduped list of people — built from whichever properties are
/// currently represented on the maintenance board, not a fixed org-wide
/// roster. Fetches per-property client-user-properties once each (cached
/// for the lifetime of this provider instance) as new properties appear
/// among loaded maintenance requests; never re-fetches an already-seen
/// property.
@riverpod
class MaintenanceAssigneesNotifier extends _$MaintenanceAssigneesNotifier {
  final Set<String> _fetchedPropertyIds = {};
  final Map<String, MaintenanceAssigneeModel> _byId = {};

  @override
  List<MaintenanceAssigneeModel> build() => const [];

  Future<void> ensurePropertiesLoaded(Iterable<String> propertyIds) async {
    final clientId = ref.read(currentWorkspaceNotifierProvider)?.clientId;
    if (clientId == null) return;

    final newIds = propertyIds
        .toSet()
        .difference(_fetchedPropertyIds)
        .toList();
    if (newIds.isEmpty) return;

    for (final propertyId in newIds) {
      _fetchedPropertyIds.add(propertyId);
      try {
        final people = await ref
            .read(clientUserPropertyApiProvider)
            .getClientUserProperties(clientId: clientId, propertyId: propertyId);
        for (final person in people) {
          _byId[person.id] = person;
        }
      } catch (_) {
        // A single property's people failing to load shouldn't block the
        // rest of the board's filter options — that property's people
        // simply won't appear in the list; retried on next distinct-id
        // recompute only if the id is removed from _fetchedPropertyIds,
        // which doesn't happen here (matches "don't re-fetch a seen
        // property" — a transient failure is treated the same as "no
        // people found for this property" rather than retried forever).
      }
    }

    state = _byId.values.toList();
  }
}
