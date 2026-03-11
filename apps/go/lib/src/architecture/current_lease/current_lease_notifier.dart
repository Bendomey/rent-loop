import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

part 'current_lease_notifier.g.dart';

@Riverpod(keepAlive: true)
class CurrentLeaseNotifier extends _$CurrentLeaseNotifier {
  @override
  LeaseModel? build() => null;

  /// Called after leases are fetched. Restores the persisted lease or
  /// falls back to the first in the list, persisting that choice.
  Future<void> loadFromLeases(List<LeaseModel> leases) async {
    if (leases.isEmpty) return;

    final manager = ref.read(leaseIdManagerProvider);
    final savedId = await manager.get();

    if (savedId != null) {
      LeaseModel? match;
      for (final l in leases) {
        if (l.id == savedId) {
          match = l;
          break;
        }
      }
      if (match != null) {
        state = match;
        return;
      }
    }

    // Nothing saved or saved ID no longer in list — fall back to first.
    final first = leases.first;
    await manager.save(first.id);
    state = first;
  }

  /// Explicitly switch the active lease and persist the choice.
  Future<void> setLease(LeaseModel lease) async {
    await ref.read(leaseIdManagerProvider).save(lease.id);
    state = lease;
  }

  void clear() {
    state = null;
  }
}
