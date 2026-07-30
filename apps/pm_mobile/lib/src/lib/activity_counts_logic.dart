import 'package:rentloop_manager/src/lib/property_stats_logic.dart'
    show parseCubeNum;
import 'package:rentloop_manager/src/repository/models/activity_counts_model.dart';

/// Combines the raw `data` rows from 3 separate Cube `/load` queries into the
/// Activity screen's segment badges.
///
/// Each cube resolves the caller's property access itself, from the client and
/// client-user ids in the analytics JWT (see `services/cube/model/scope.js`),
/// so these queries carry no filters — the counts are already scoped to what
/// the signed-in user may see.
///
/// Status rollups, chosen to mean "needs attention" rather than "ever
/// existed":
///  - Maintenance:  New + In Progress + In Review (excludes Resolved/Cancelled)
///  - Applications: In Progress (excludes Completed/Cancelled)
///  - Bookings:     Confirmed + Checked In (excludes Completed/Cancelled)
///
/// Every list is empty rather than null when Cube matches no rows (a brand new
/// workspace, or a user with no property access), which must default each
/// count to 0, not throw.
ActivityCounts computeActivityCounts({
  required List<Map<String, dynamic>> maintenanceRows,
  required List<Map<String, dynamic>> applicationRows,
  required List<Map<String, dynamic>> bookingRows,
}) {
  final maintenanceRow = maintenanceRows.isNotEmpty
      ? maintenanceRows.first
      : const {};
  final applicationRow = applicationRows.isNotEmpty
      ? applicationRows.first
      : const {};
  final bookingRow = bookingRows.isNotEmpty ? bookingRows.first : const {};

  return ActivityCounts(
    maintenance:
        parseCubeNum(maintenanceRow['MaintenanceRequests.newCount']) +
        parseCubeNum(maintenanceRow['MaintenanceRequests.inProgressCount']) +
        parseCubeNum(maintenanceRow['MaintenanceRequests.inReviewCount']),
    applications: parseCubeNum(
      applicationRow['TenantApplications.inProgressCount'],
    ),
    bookings:
        parseCubeNum(bookingRow['Bookings.confirmedCount']) +
        parseCubeNum(bookingRow['Bookings.checkedInCount']),
  );
}
