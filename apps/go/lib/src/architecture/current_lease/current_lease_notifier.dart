import 'package:rentloop_go/src/architecture/architecture.dart';
import 'package:rentloop_go/src/lib/analytics_service.dart';
import 'package:rentloop_go/src/repository/models/lease_model.dart';

part 'current_lease_notifier.g.dart';

/// All leases loaded for the current account. Populated by [CurrentLeaseNotifier.loadFromLeases].
/// Use this to look up a lease by ID (e.g. when handling notification deep links).
final allLeasesProvider = StateProvider<List<LeaseModel>>((_) => const []);

@Riverpod(keepAlive: true)
class CurrentLeaseNotifier extends _$CurrentLeaseNotifier {
  @override
  LeaseModel? build() => null;

  /// Called after leases are fetched. Restores the persisted lease or
  /// falls back to the first in the list, persisting that choice.
  Future<void> loadFromLeases(List<LeaseModel> leases) async {
    ref.read(allLeasesProvider.notifier).state = leases;
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
    await AnalyticsService.logEvent('lease_switched', parameters: {'lease_id': lease.id});
  }

  void clear() {
    ref.read(allLeasesProvider.notifier).state = const [];
    state = null;
  }
}
