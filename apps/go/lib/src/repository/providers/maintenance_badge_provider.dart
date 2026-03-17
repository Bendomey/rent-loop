import 'package:rentloop_go/src/api/maintenance.dart';
import 'package:rentloop_go/src/architecture/architecture.dart';

part 'maintenance_badge_provider.g.dart';

/// Fetches MR counts grouped by status via the dedicated stats endpoint.
/// keepAlive so the badge count persists across tabs.
@Riverpod(keepAlive: true)
Future<Map<String, int>> mrStats(MrStatsRef ref) async {
  final activeLease = ref.watch(currentLeaseNotifierProvider);
  if (activeLease == null) return {};
  final stats = await ref
      .read(maintenanceApiProvider)
      .getMaintenanceRequestStats(activeLease.id);
  final activeCount =
      (stats['new'] ?? 0) +
      (stats['in_progress'] ?? 0) +
      (stats['in_review'] ?? 0);
  ref.read(maintenanceRequestTotalNotifierProvider.notifier).set(activeCount);
  return stats;
}

/// Holds the active maintenance-request count for the bottom-nav badge.
@Riverpod(keepAlive: true)
class MaintenanceRequestTotalNotifier
    extends _$MaintenanceRequestTotalNotifier {
  @override
  int build() => 0;

  void set(int total) => state = total;
}
