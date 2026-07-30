/// The three badge numbers on the Activity screen's segmented control.
///
/// Each is an *open/active* count, not an all-time total: resolved, completed
/// and cancelled records never age out of the database, so a lifetime total
/// would climb forever and stop meaning anything as a badge. See
/// `computeActivityCounts` for exactly which statuses each one rolls up.
class ActivityCounts {
  final int maintenance;
  final int applications;
  final int bookings;

  const ActivityCounts({
    this.maintenance = 0,
    this.applications = 0,
    this.bookings = 0,
  });
}
